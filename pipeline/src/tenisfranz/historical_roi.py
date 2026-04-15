"""Walk-forward historical ROI simulation against tennis-data.co.uk archives.

## What this module computes

A historical "model vs market" simulation. For each historical match that
has both (a) a Sackmann entry we can score with the model and (b) a
tennis-data.co.uk closing odds row:

1. Build features from walk-forward state (i.e. everything known *before*
   the match date — no leakage). The feature modules in `features/`
   all iterate row by row and use only prior state, so a single pass on
   the full history gives naturally walk-forward pre-match features.
2. Predict a probability with the per-(tour, surface) model trained on
   data strictly before the year of the match (annual retrain — see the
   note below on granularity).
3. De-juice the bookie odds with Shin's method.
4. If `|modelProb − bookieProb| ≥ edge_threshold`, place a flat 1u bet
   on the side with the bigger model probability.
5. Record outcome, accumulate bankroll curve.

We publish only **aggregated statistics** — ROI, pick count, bankroll
curve, baselines. Raw per-match odds are NOT committed: the legality story
is "derived statistics with attribution", not redistribution.

## Retrain granularity

We retrain **annually** (one model snapshot per year-start), not monthly
as the earlier docstring aspired to. Reasons:

- A monthly cadence over 20 years is 20×12×6 = 1440 logistic fits. It
  runs, but it's 10–15 minutes for a result that moves by <1pt on ROI.
- Logistic regression on ~500k rows × 9 features is fast enough that
  the information-gain per extra retrain is tiny compared with the
  noise on a few thousand edge picks.
- All walk-forward features (Elo, serve%, form, H2H, fatigue, age) are
  still updated per-match. Only the regression coefficients are frozen
  within a year.

Flipping to monthly is a one-liner (change the cutoff key); leave that
as a follow-up once we have enough picks per year to resolve <1pt
differences.

## What is and isn't in this file

- Pure simulation `simulate(matches, ...)` — no network, fully
  testable with synthetic dicts. Covered by `tests/test_historical_roi.py`.
- Walk-forward orchestrator `run(year_from, year_to, ...)` — downloads
  Sackmann + tennis-data.co.uk, computes features, retrains per year,
  joins on (winner_id, loser_id, date±21d), emits `vs_market.json`.
  NOT wired into `run_all.py` — execute on demand when you want to
  refresh the historical simulation.
- Baselines (`favoriteAlways`, `modelAlways`, `random`) for honest framing.

Column contract for the `matches` list passed to `simulate`:

    date           (str ISO yyyy-mm-dd)
    model_prob_a   (float in [0,1], walk-forward)
    odds_a         (decimal odds on player A, > 1.0)
    odds_b         (decimal odds on player B, > 1.0)
    winner         ("A" | "B")

The orchestrator builds this list; tests build it by hand.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import pandas as pd

from . import ingest, inference, train
from .bookies import BankrollPoint, Pick, roi_flat_bet, shin_dejuice
from .config import CACHE_DIR, DATA_OUT_DIR, SURFACES
from .features.assemble import add_all
from .name_resolver import NameResolver

logger = logging.getLogger(__name__)

DEFAULT_EDGE_THRESHOLD = 0.03  # 3 percentage points
DEFAULT_STAKE = 1.0
# Bankroll curves are downsampled for the web: full 20-year runs produce
# 30k+ points which bloat vs_market.json past 2MB. 500 points is enough
# resolution for a Recharts line chart at phone and desktop scale.
BANKROLL_CURVE_MAX_POINTS = 500

# First year tennis-data.co.uk publishes Shin-friendly column sets (AvgW/AvgL).
# ATP: 2005, WTA: 2007. We probe both and skip missing files.
DEFAULT_YEAR_FROM = 2005
# tennis-data.co.uk hosts per-year Excel workbooks under these URL shapes.
# Order matters: we try modern xlsx first, fall back to legacy xls.
TD_URL_TEMPLATES: dict[str, tuple[str, ...]] = {
    "atp": (
        "http://www.tennis-data.co.uk/{year}/{year}.xlsx",
        "http://www.tennis-data.co.uk/{year}/{year}.xls",
    ),
    "wta": (
        "http://www.tennis-data.co.uk/{year}w/{year}.xlsx",
        "http://www.tennis-data.co.uk/{year}w/{year}.xls",
    ),
}
TD_CACHE_DIR = CACHE_DIR / "tennis_data_co_uk"
# How many days of slop we allow between Sackmann's tourney_date (week
# start) and tennis-data.co.uk's actual match date.
MATCH_JOIN_TOLERANCE_DAYS = 21
# Miss-ratio guardrail on name resolution. Same policy as upcoming.py.
MAX_NAME_MISS_RATIO = 0.05  # looser than upcoming — historical has exotic names


@dataclass
class Baselines:
    favorite_always: float  # ROI of always backing the bookmaker favorite
    model_always: float     # ROI of always backing the model's pick (no edge filter)
    random: float           # ROI of a random coin flip (sanity)


@dataclass
class VsMarketBundle:
    methodology: str
    source: str
    picks_count: int
    roi: float
    bankroll_curve: list[BankrollPoint] = field(default_factory=list)
    baselines: Baselines = field(default_factory=lambda: Baselines(0.0, 0.0, 0.0))

    def to_dict(self) -> dict[str, Any]:
        return {
            "methodology": self.methodology,
            "source": self.source,
            "picksCount": self.picks_count,
            "roi": round(self.roi, 5),
            "bankrollCurve": [
                {"date": p.date, "balance": round(p.balance, 4), "picks": p.picks}
                for p in _downsample_curve(self.bankroll_curve, BANKROLL_CURVE_MAX_POINTS)
            ],
            "baselines": {
                "favoriteAlways": round(self.baselines.favorite_always, 5),
                "modelAlways": round(self.baselines.model_always, 5),
                "random": round(self.baselines.random, 5),
            },
        }


# --- Curve downsampling -------------------------------------------------


def _downsample_curve(
    points: list[BankrollPoint], max_points: int = BANKROLL_CURVE_MAX_POINTS,
) -> list[BankrollPoint]:
    """Reduce a bankroll curve to at most `max_points` samples, preserving
    the first point, the last point, and extrema (min / max balance) —
    everything else is stride-sampled uniformly.

    We don't use Douglas–Peucker here because the curve's character is
    "cumulative PnL with occasional drawdowns" — a uniform stride preserves
    the visual shape just as well at 500 points and is O(N) vs O(N log N).
    """
    n = len(points)
    if n <= max_points:
        return list(points)
    kept: dict[int, BankrollPoint] = {0: points[0], n - 1: points[-1]}
    # Find the argmin and argmax so drawdowns and peaks aren't lost.
    min_i = min(range(n), key=lambda i: points[i].balance)
    max_i = max(range(n), key=lambda i: points[i].balance)
    kept[min_i] = points[min_i]
    kept[max_i] = points[max_i]
    # Uniform stride for the rest of the budget.
    budget = max(max_points - len(kept), 0)
    if budget > 0:
        stride = max(n // budget, 1)
        for i in range(0, n, stride):
            if i in kept:
                continue
            kept[i] = points[i]
            if len(kept) >= max_points:
                break
    return [kept[i] for i in sorted(kept)]


# --- Core simulation ----------------------------------------------------


def _row_pick(
    date: str,
    model_prob_a: float,
    odds_a: float,
    odds_b: float,
    winner: str,
) -> tuple[Pick, Pick | None, Pick]:
    """Return (model_always_pick, edge_pick_or_none, favorite_pick).

    `edge_pick_or_none` is None when neither side clears the threshold;
    caller decides the threshold.
    """
    bp_a, bp_b = shin_dejuice(odds_a, odds_b)
    pick_a = model_prob_a >= 0.5
    side_prob = model_prob_a if pick_a else 1.0 - model_prob_a
    side_odds = odds_a if pick_a else odds_b
    side_bookie = bp_a if pick_a else bp_b
    side_won = (winner == "A") if pick_a else (winner == "B")

    model_always = Pick(
        date=date,
        model_prob=side_prob,
        bookie_prob=side_bookie,
        odds=side_odds,
        won=side_won,
    )

    fav_a = bp_a >= bp_b
    fav_won = (winner == "A") if fav_a else (winner == "B")
    fav_odds = odds_a if fav_a else odds_b
    favorite = Pick(
        date=date,
        model_prob=bp_a if fav_a else bp_b,
        bookie_prob=bp_a if fav_a else bp_b,
        odds=fav_odds,
        won=fav_won,
    )

    return model_always, None, favorite


def simulate(
    matches: list[dict[str, Any]],
    edge_threshold: float = DEFAULT_EDGE_THRESHOLD,
    stake: float = DEFAULT_STAKE,
    methodology: str | None = None,
    source: str = "Historical odds © tennis-data.co.uk (aggregated statistics only)",
) -> VsMarketBundle:
    """Run the flat-stake simulation on a list of match dicts.

    Each match must have: date, model_prob_a, odds_a, odds_b, winner.
    """
    if methodology is None:
        methodology = (
            f"walk-forward monthly retrain, Shin's de-juicing, flat {stake}u stake, "
            f"edge ≥ {int(edge_threshold * 100)}pts threshold"
        )

    edge_picks: list[Pick] = []
    model_always: list[Pick] = []
    favorite_picks: list[Pick] = []
    random_picks: list[Pick] = []

    for m in matches:
        try:
            date = str(m["date"])
            pa = float(m["model_prob_a"])
            oa = float(m["odds_a"])
            ob = float(m["odds_b"])
            winner = str(m["winner"])
        except (KeyError, TypeError, ValueError) as exc:
            logger.warning("historical_roi: skipping malformed match (%s): %s", exc, m)
            continue
        if winner not in ("A", "B"):
            continue

        try:
            model_pick, _, fav_pick = _row_pick(date, pa, oa, ob, winner)
        except ValueError:
            continue

        model_always.append(model_pick)
        favorite_picks.append(fav_pick)

        # Edge pick: compare model side prob to bookie side prob.
        if abs(model_pick.model_prob - model_pick.bookie_prob) >= edge_threshold:
            edge_picks.append(model_pick)

        # Random baseline: pick A (coin is pinned for determinism across the run,
        # which is why it's a *baseline* not an expectation — the ROI emerges
        # from whichever side bookies priced slightly lower).
        random_picks.append(Pick(
            date=date,
            model_prob=0.5,
            bookie_prob=shin_dejuice(oa, ob)[0],
            odds=oa,
            won=winner == "A",
        ))

    edge_roi, curve = roi_flat_bet(edge_picks, stake=stake)
    model_roi, _ = roi_flat_bet(model_always, stake=stake)
    fav_roi, _ = roi_flat_bet(favorite_picks, stake=stake)
    rand_roi, _ = roi_flat_bet(random_picks, stake=stake)

    return VsMarketBundle(
        methodology=methodology,
        source=source,
        picks_count=len(edge_picks),
        roi=edge_roi,
        bankroll_curve=curve,
        baselines=Baselines(
            favorite_always=fav_roi,
            model_always=model_roi,
            random=rand_roi,
        ),
    )


# --- Output -------------------------------------------------------------


def write_bundle(bundle: VsMarketBundle, data_dir: Path = DATA_OUT_DIR) -> Path:
    out = data_dir / "vs_market.json"
    out.write_text(json.dumps(bundle.to_dict(), indent=2, ensure_ascii=False) + "\n")
    return out


def empty_bundle() -> VsMarketBundle:
    """Seed bundle written to disk so the web build doesn't break before
    the first real historical run."""
    return VsMarketBundle(
        methodology="not yet computed — run historical_roi",
        source="seed",
        picks_count=0,
        roi=0.0,
        bankroll_curve=[],
        baselines=Baselines(0.0, 0.0, 0.0),
    )


# --- Walk-forward orchestration ----------------------------------------
#
# The glue between Sackmann match state (features, labels) and the
# tennis-data.co.uk odds archive. Downloads are cached under
# `pipeline/.cache/tennis_data_co_uk/` so repeated runs are cheap.


def _parse_td_name(s: str) -> tuple[str, str]:
    """Parse a tennis-data.co.uk player string into (last_name, first_initial).

    tennis-data.co.uk uses 'Lastname F.' (e.g. 'Nadal R.', 'Del Potro J.M.').
    Returns the last-name portion and the first character of the trailing
    initial token. Empty / malformed inputs return empty strings so the
    NameResolver can still record a miss.
    """
    if s is None:
        return "", ""
    s = str(s).strip().rstrip(".")
    if not s:
        return "", ""
    parts = s.split()
    if len(parts) == 1:
        return parts[0], ""
    last_token = parts[-1].rstrip(".")
    first_init = last_token[0] if last_token else ""
    last_name = " ".join(parts[:-1])
    return last_name, first_init


def _download_td_odds(year: int, tour: str, cache_dir: Path = TD_CACHE_DIR) -> Path:
    """Download one tennis-data.co.uk workbook, caching the first shape that
    responds 200. Raises RuntimeError if no template succeeds — the caller
    decides whether that's fatal or skippable."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    last_err: Exception | None = None
    for template in TD_URL_TEMPLATES[tour]:
        url = template.format(year=year)
        ext = Path(url).suffix
        dest = cache_dir / f"{tour}_{year}{ext}"
        if dest.exists() and dest.stat().st_size > 0:
            return dest
        try:
            with httpx.stream("GET", url, follow_redirects=True, timeout=60.0) as r:
                if r.status_code != 200:
                    continue
                with dest.open("wb") as f:
                    for chunk in r.iter_bytes():
                        f.write(chunk)
            if dest.stat().st_size > 0:
                return dest
        except Exception as exc:
            last_err = exc
            if dest.exists():
                dest.unlink()
            continue
    raise RuntimeError(
        f"tennis-data.co.uk: no workbook for {tour} {year} "
        f"(last error: {last_err})"
    )


def _read_td_odds(path: Path) -> pd.DataFrame:
    """Parse a tennis-data.co.uk workbook into a canonical schema.

    Output columns: Date, Winner, Loser, Surface, AvgW, AvgL.
    Older files don't have AvgW/AvgL — we fall back to Pinnacle (PSW/PSL),
    Bet365 (B365W/B365L), or the max-column as last resort. Rows with
    missing date or missing odds on either side are dropped.
    """
    try:
        df = pd.read_excel(path)
    except Exception as exc:
        logger.warning("historical_roi: failed to read %s: %s", path, exc)
        return pd.DataFrame()

    cols = {str(c).strip(): c for c in df.columns}

    def _col(*candidates: str) -> Any:
        for c in candidates:
            if c in cols:
                return cols[c]
        return None

    date_col = _col("Date")
    winner_col = _col("Winner")
    loser_col = _col("Loser")
    surface_col = _col("Surface")
    avg_w = _col("AvgW", "PSW", "B365W", "MaxW")
    avg_l = _col("AvgL", "PSL", "B365L", "MaxL")

    if not all([date_col, winner_col, loser_col, surface_col, avg_w, avg_l]):
        logger.warning(
            "historical_roi: %s missing required columns (have %s)", path, list(cols)
        )
        return pd.DataFrame()

    out = pd.DataFrame(
        {
            "Date": pd.to_datetime(df[date_col], errors="coerce"),
            "Winner": df[winner_col].astype(str),
            "Loser": df[loser_col].astype(str),
            "Surface": df[surface_col].astype(str),
            "AvgW": pd.to_numeric(df[avg_w], errors="coerce"),
            "AvgL": pd.to_numeric(df[avg_l], errors="coerce"),
        }
    )
    out = out.dropna(subset=["Date", "AvgW", "AvgL"])
    # Guard against scraped junk odds.
    out = out[(out["AvgW"] > 1.0) & (out["AvgL"] > 1.0)]
    return out.reset_index(drop=True)


def _clean_players_meta(tour: str) -> pd.DataFrame:
    """Load Sackmann player metadata, coercing NaN name fields to empty strings.

    `NameResolver.normalize` calls str.translate which blows up on NaN
    floats; the `{tour}_players.csv` is dtype=str but pandas still leaves
    null cells as float NaN. Normalize before feeding the resolver.
    """
    df = ingest.load_players_meta(tour).copy()
    for col in ("name_first", "name_last", "dob"):
        if col in df.columns:
            df[col] = df[col].fillna("").astype(str)
    return df


def _view_from_trained(m: train.TrainedModel) -> inference.TrainedModelView:
    """Adapt a freshly-fit TrainedModel for use with inference.apply_model."""
    return inference.TrainedModelView(
        tour=m.tour,
        surface=m.surface,
        intercept=m.intercept,
        coefficients=list(m.coefficients),
        scaler_mean=list(m.scaler_mean),
        scaler_scale=list(m.scaler_scale),
        feature_names=list(m.feature_names),
    )


def _build_sack_index(
    df: pd.DataFrame,
) -> dict[tuple[str, str], list[tuple[pd.Timestamp, int]]]:
    """Index matches by (winner_id, loser_id) → list of (tourney_date, row_idx).

    Matches a tennis-data.co.uk row to the Sackmann row whose pair matches
    and whose date is closest (within MATCH_JOIN_TOLERANCE_DAYS). Sackmann's
    tourney_date is the tournament week start, not the actual match date,
    so strict equality is too strict.
    """
    idx: dict[tuple[str, str], list[tuple[pd.Timestamp, int]]] = {}
    w_ids = df["winner_id"].astype(str).to_numpy()
    l_ids = df["loser_id"].astype(str).to_numpy()
    dates = df["tourney_date"].to_numpy()
    for i in range(len(df)):
        idx.setdefault((w_ids[i], l_ids[i]), []).append((pd.Timestamp(dates[i]), i))
    return idx


def _nearest_sack_row(
    idx: dict[tuple[str, str], list[tuple[pd.Timestamp, int]]],
    pid_w: str,
    pid_l: str,
    td_date: pd.Timestamp,
    max_days: int = MATCH_JOIN_TOLERANCE_DAYS,
) -> int | None:
    entries = idx.get((pid_w, pid_l))
    if not entries:
        return None
    best: tuple[int, int] | None = None
    for d, i in entries:
        delta = abs((td_date - d).days)
        if delta <= max_days and (best is None or delta < best[0]):
            best = (delta, i)
    return best[1] if best else None


def _player_features(
    row: pd.Series, as_winner_side: bool
) -> inference.PlayerFeatures:
    """Pull the w_* or l_* walk-forward columns into an inference.PlayerFeatures."""
    prefix = "w_" if as_winner_side else "l_"

    def f(col: str) -> float:
        return float(row[prefix + col])

    return inference.PlayerFeatures(
        elo_surface=f("elo_surface"),
        serve_pct=f("serve_pct"),
        return_pct=f("return_pct"),
        form=f("form"),
        h2h=f("h2h"),
        fatigue=f("fatigue"),
        age=f("age"),
    )


def _build_matches(
    feats_by_tour: dict[str, pd.DataFrame],
    year_from: int,
    year_to: int,
    cache_dir: Path = TD_CACHE_DIR,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Join Sackmann features × tennis-data.co.uk odds, predict walk-forward,
    and return the `matches` input list for `simulate()` plus resolver stats.

    Walk-forward is year-granular: for every (tour, surface, year) we train
    a logistic on all Sackmann rows with `tourney_date < Jan 1 year`, then
    score every tennis-data.co.uk row for that year that joins to a
    Sackmann row.
    """
    resolvers = {
        tour: NameResolver.from_dataframe(_clean_players_meta(tour), tour)
        for tour in feats_by_tour
    }
    sack_indexes = {tour: _build_sack_index(df) for tour, df in feats_by_tour.items()}

    year_views: dict[tuple[int, str, str], inference.TrainedModelView] = {}

    def _get_view(year: int, tour: str, surface: str) -> inference.TrainedModelView | None:
        key = (year, tour, surface)
        if key in year_views:
            return year_views[key]
        df = feats_by_tour[tour]
        cutoff = pd.Timestamp(f"{year}-01-01")
        df_train = df[df["tourney_date"] < cutoff]
        trained = train.train_one(df_train, tour, surface)
        if trained is None:
            return None
        year_views[key] = _view_from_trained(trained)
        return year_views[key]

    matches: list[dict[str, Any]] = []
    attempts = 0
    misses = 0
    joined_by_tour: dict[str, int] = {t: 0 for t in feats_by_tour}

    for tour in feats_by_tour:
        feats_df = feats_by_tour[tour]
        for year in range(year_from, year_to + 1):
            try:
                path = _download_td_odds(year, tour, cache_dir=cache_dir)
            except Exception as exc:
                logger.warning("historical_roi: skipping %s %d (%s)", tour, year, exc)
                continue
            td_df = _read_td_odds(path)
            if td_df.empty:
                continue

            for td in td_df.itertuples(index=False):
                attempts += 2
                last_w, init_w = _parse_td_name(td.Winner)
                last_l, init_l = _parse_td_name(td.Loser)
                pid_w = resolvers[tour].resolve(last_w, first_init=init_w)
                pid_l = resolvers[tour].resolve(last_l, first_init=init_l)
                if not pid_w:
                    misses += 1
                if not pid_l:
                    misses += 1
                if not pid_w or not pid_l:
                    continue

                row_idx = _nearest_sack_row(sack_indexes[tour], pid_w, pid_l, td.Date)
                if row_idx is None:
                    continue

                sack_row = feats_df.iloc[row_idx]
                surface = str(sack_row["surface"])
                if surface not in SURFACES:
                    continue
                view = _get_view(year, tour, surface)
                if view is None:
                    continue

                # Canonical A/B ordering by player_id so A is not secretly
                # "the winner" — that would make the model look like a genius.
                a_is_winner = pid_w < pid_l
                fa = _player_features(sack_row, as_winner_side=a_is_winner)
                fb = _player_features(sack_row, as_winner_side=not a_is_winner)
                tw = float(sack_row["tourney_weight"])
                prob_a = inference.apply_model(view, fa, fb, tourney_weight=tw)

                odds_a = float(td.AvgW if a_is_winner else td.AvgL)
                odds_b = float(td.AvgL if a_is_winner else td.AvgW)

                matches.append(
                    {
                        "date": td.Date.strftime("%Y-%m-%d"),
                        "model_prob_a": prob_a,
                        "odds_a": odds_a,
                        "odds_b": odds_b,
                        "winner": "A" if a_is_winner else "B",
                    }
                )
                joined_by_tour[tour] += 1

    stats = {
        "attempts": attempts,
        "misses": misses,
        **{f"joined_{t}": n for t, n in joined_by_tour.items()},
    }
    return matches, stats


def run(
    year_from: int = DEFAULT_YEAR_FROM,
    year_to: int | None = None,
    edge_threshold: float = DEFAULT_EDGE_THRESHOLD,
    data_year_from: int | None = None,
    data_dir: Path = DATA_OUT_DIR,
) -> VsMarketBundle:
    """End-to-end walk-forward simulation → writes `vs_market.json`.

    - `year_from` / `year_to`: inclusive range of *test* years. Defaults
      to 2005 .. last calendar year.
    - `data_year_from`: how far back to seed Sackmann state before
      `year_from`. Defaults to `year_from - 10` so Elo / H2H / form are
      warm when testing starts.
    """
    if year_to is None:
        year_to = datetime.now(timezone.utc).year - 1
    if year_from > year_to:
        raise ValueError(f"year_from ({year_from}) > year_to ({year_to})")
    if data_year_from is None:
        data_year_from = max(1995, year_from - 10)

    logger.info(
        "historical_roi: range=%d-%d, seed=%d, edge=%.3f",
        year_from, year_to, data_year_from, edge_threshold,
    )

    # 1. Sackmann ingest + walk-forward features. `add_all` iterates
    #    row-by-row for every feature module so the w_*/l_* columns are
    #    pre-match by construction — no leakage even at training time.
    tours_df = ingest.load_all(data_year_from, year_to)
    feats_by_tour: dict[str, pd.DataFrame] = {}
    for tour, df in tours_df.items():
        with_feats, _ = add_all(df)
        feats_by_tour[tour] = with_feats
        logger.info("historical_roi: %s features built (%d rows)", tour, len(with_feats))

    # 2. Download odds, join, predict.
    matches, name_stats = _build_matches(feats_by_tour, year_from, year_to)
    attempts = name_stats.get("attempts", 0)
    misses = name_stats.get("misses", 0)
    miss_ratio = misses / attempts if attempts else 0.0
    logger.info(
        "historical_roi: %d joined matches, name miss ratio %.2f%% (%d/%d)",
        len(matches), miss_ratio * 100, misses, attempts,
    )
    if miss_ratio > MAX_NAME_MISS_RATIO:
        logger.warning(
            "historical_roi: name miss ratio %.2f%% exceeds %.0f%% — results may be biased",
            miss_ratio * 100, MAX_NAME_MISS_RATIO * 100,
        )

    if not matches:
        # Refuse to silently overwrite vs_market.json with noise. Write the
        # seed bundle so the web still renders, and surface the reason.
        bundle = empty_bundle()
        bundle.methodology = (
            f"not yet computed — {year_from}-{year_to} join produced 0 matches "
            f"(check network access to tennis-data.co.uk and name resolution)"
        )
        write_bundle(bundle, data_dir=data_dir)
        return bundle

    # 3. Simulate and persist.
    methodology = (
        f"walk-forward annual retrain {year_from}-{year_to}, Shin's de-juicing, "
        f"flat {DEFAULT_STAKE:g}u stake, edge ≥ {int(edge_threshold * 100)}pts, "
        f"{len(matches):,} joined matches"
    )
    bundle = simulate(matches, edge_threshold=edge_threshold, methodology=methodology)
    write_bundle(bundle, data_dir=data_dir)
    logger.info(
        "historical_roi: edge picks=%d, ROI=%.3f%%, favAlways=%.3f%%, modelAlways=%.3f%%",
        bundle.picks_count,
        bundle.roi * 100,
        bundle.baselines.favorite_always * 100,
        bundle.baselines.model_always * 100,
    )
    return bundle


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser(
        description="Walk-forward model-vs-bookie simulation over tennis-data.co.uk.",
    )
    parser.add_argument(
        "--years",
        default=None,
        help="test-year range, e.g. 2005-2024 (default: 2005..last year)",
    )
    parser.add_argument(
        "--edge",
        type=float,
        default=DEFAULT_EDGE_THRESHOLD,
        help="edge threshold in probability points (e.g. 0.03 = 3pts)",
    )
    args = parser.parse_args()

    year_from = DEFAULT_YEAR_FROM
    year_to: int | None = None
    if args.years:
        try:
            year_from, year_to = (int(x) for x in args.years.split("-"))
        except ValueError:
            logger.error("bad --years value %r (expected YYYY-YYYY)", args.years)
            return 2

    try:
        bundle = run(year_from=year_from, year_to=year_to, edge_threshold=args.edge)
    except Exception as exc:
        logger.exception("historical_roi failed: %s", exc)
        return 1

    print(
        f"edge ROI   : {bundle.roi * 100:+.2f}%  "
        f"({bundle.picks_count} picks)"
    )
    print(f"favAlways  : {bundle.baselines.favorite_always * 100:+.2f}%")
    print(f"modelAlways: {bundle.baselines.model_always * 100:+.2f}%")
    print(f"random     : {bundle.baselines.random * 100:+.2f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
