"""Walk-forward historical ROI simulation against tennis-data.co.uk archives.

## What this module computes

A historical "model vs market" simulation. For each historical match that
has both (a) a Sackmann entry we can score with the model and (b) a
tennis-data.co.uk closing odds row:

1. Build features from walk-forward state (i.e. everything known *before*
   the match date — no leakage).
2. Predict a probability with the tour+surface model trained on data
   strictly before the month of the match (monthly retrain).
3. De-juice the bookie odds with Shin's method.
4. If `|modelProb − bookieProb| ≥ edge_threshold`, place a flat 1u bet
   on the side with the bigger model probability.
5. Record outcome, accumulate bankroll curve.

We publish only **aggregated statistics** — ROI, pick count, bankroll
curve, baselines. Raw per-match odds are NOT committed: the legality story
is "derived statistics with attribution", not redistribution.

## What is and isn't in this file

- Pure simulation `simulate(matches, predict_fn)` — no network, fully
  testable with synthetic DataFrames.
- `run(year_from, year_to, out_path)` — thin orchestrator that assumes the
  caller handles downloads + retrain. Deliberately NOT wired into
  `run_all.py` today; execute on demand.
- Baselines (`favoriteAlways`, `modelAlways`, `random`) for honest framing.

Column contract for the `matches` DataFrame passed to `simulate`:

    date           (str ISO yyyy-mm-dd)
    tour           ("atp" | "wta")
    surface        ("Hard" | "Clay" | "Grass")
    model_prob_a   (float in [0,1], walk-forward)
    odds_a         (decimal odds on player A, > 1.0)
    odds_b         (decimal odds on player B, > 1.0)
    winner         ("A" | "B")

The caller is responsible for building this DataFrame (and for running
the monthly-retrain walk-forward). This separation keeps tests fast.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from .bookies import BankrollPoint, Pick, roi_flat_bet, shin_dejuice
from .config import DATA_OUT_DIR

logger = logging.getLogger(__name__)

DEFAULT_EDGE_THRESHOLD = 0.03  # 3 percentage points
DEFAULT_STAKE = 1.0


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
                for p in self.bankroll_curve
            ],
            "baselines": {
                "favoriteAlways": round(self.baselines.favorite_always, 5),
                "modelAlways": round(self.baselines.model_always, 5),
                "random": round(self.baselines.random, 5),
            },
        }


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
