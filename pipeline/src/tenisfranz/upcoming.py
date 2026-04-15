"""Generate matches_upcoming.json from live draws + committed model.json.

Runtime path (cron 07:00 UTC via .github/workflows/upcoming.yml):

1. Fetch ATP + WTA draws through `draws_fetcher` (file-backed today,
   HTTP-backed once endpoints are verified).
2. Load `model.json` from `web/public/data/`. **Check `trainedAt` staleness**
   — fail fast if older than `MAX_MODEL_AGE_DAYS` so we don't ship predictions
   from a dead pipeline.
3. Load `elo.json` + `players.json` for feature building + name→slug mapping.
4. Resolve raw player names to Sackmann player_id via `NameResolver`.
   Hard-fail if miss ratio exceeds `MAX_MISS_RATIO`.
5. Build `PlayerFeatures` from committed state (Elo real, rest defaulted —
   matches `web/lib/predict.ts::buildPlayerFeatures` behavior).
6. Run `inference.apply_model` per (match, surface). Pick the correct
   per-surface model.
7. Emit `web/public/data/matches_upcoming.json` with a stable id scheme
   and no odds field.

This module does NOT train. It's read-only against the nightly pipeline's
output. Runs in <30s.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from . import draws_fetcher, inference
from .config import DATA_OUT_DIR, TOURNEY_WEIGHTS
from .draws_fetcher import DrawMatch
from .name_resolver import NameResolver, normalize

logger = logging.getLogger(__name__)

MAX_MODEL_AGE_DAYS = 7
MAX_MISS_RATIO = 0.02
DEFAULT_SERVE = 0.63
DEFAULT_RETURN = 0.37
DEFAULT_FORM = 0.5
DEFAULT_H2H = 0.5
DEFAULT_FATIGUE = 0.0
DEFAULT_AGE = 25.0
DEFAULT_ELO = 1500.0


# --- Data loaders -------------------------------------------------------


def _load_json(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"missing data file: {path}")
    return json.loads(path.read_text())


def load_model_bundle(data_dir: Path = DATA_OUT_DIR) -> dict[str, Any]:
    return _load_json(data_dir / "model.json")


def load_meta(data_dir: Path = DATA_OUT_DIR) -> dict[str, Any]:
    return _load_json(data_dir / "meta.json")


def load_elo(data_dir: Path = DATA_OUT_DIR) -> list[dict[str, Any]]:
    return _load_json(data_dir / "elo.json")


def load_players(data_dir: Path = DATA_OUT_DIR) -> list[dict[str, Any]]:
    return _load_json(data_dir / "players.json")


# --- Staleness ----------------------------------------------------------


def check_model_freshness(
    meta: dict[str, Any], now: datetime, max_age_days: int = MAX_MODEL_AGE_DAYS,
) -> None:
    trained_at_raw = meta.get("trainedAt")
    if not trained_at_raw:
        raise RuntimeError("meta.json has no trainedAt — run the nightly pipeline first")
    try:
        trained_at = datetime.fromisoformat(trained_at_raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise RuntimeError(f"malformed meta.trainedAt: {trained_at_raw}") from exc
    if trained_at.tzinfo is None:
        trained_at = trained_at.replace(tzinfo=timezone.utc)
    age = now - trained_at
    if age > timedelta(days=max_age_days):
        raise RuntimeError(
            f"model is stale: trained {age.days} days ago "
            f"(limit {max_age_days}). Aborting.",
        )


# --- Feature building ---------------------------------------------------


def _elo_index(elo_rows: list[dict[str, Any]]) -> dict[tuple[str, str], float]:
    """Build (player_id, surface) → elo lookup."""
    idx: dict[tuple[str, str], float] = {}
    for row in elo_rows:
        idx[(str(row["id"]), str(row["surface"]))] = float(row["elo"])
    return idx


def _players_by_pid(players: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Map sackmann_pid → player dict. The `id` field is 'atp-<pid>' or 'wta-<pid>'."""
    out: dict[str, dict[str, Any]] = {}
    for p in players:
        raw_id = str(p["id"])
        # Strip "atp-" / "wta-" prefix to get Sackmann pid.
        if "-" in raw_id:
            _, pid = raw_id.split("-", 1)
            out[pid] = p
    return out


def _build_features(
    player: dict[str, Any],
    surface: str,
    elo_idx: dict[tuple[str, str], float],
) -> inference.PlayerFeatures:
    elo = elo_idx.get((str(player["id"]), surface), DEFAULT_ELO)
    age = float(player.get("age") or DEFAULT_AGE)
    return inference.PlayerFeatures(
        elo_surface=elo,
        serve_pct=DEFAULT_SERVE,
        return_pct=DEFAULT_RETURN,
        form=DEFAULT_FORM,
        h2h=DEFAULT_H2H,
        fatigue=DEFAULT_FATIGUE,
        age=age,
    )


# --- Name resolution ----------------------------------------------------


def _build_resolver_from_players(players: list[dict[str, Any]], tour: str) -> NameResolver:
    """Build a NameResolver from players.json rather than the Sackmann CSV.

    We use players.json because it's the ground truth for what the site knows
    about (it's post-ingest, post-filtering). The `from_dataframe` constructor
    expects pandas-style rows; we emit a list of _Candidate directly instead.
    """
    from .name_resolver import _Candidate, first_initial

    r = NameResolver(tour=tour)
    for p in players:
        if p.get("tour") != tour:
            continue
        raw_id = str(p["id"])
        pid = raw_id.split("-", 1)[1] if "-" in raw_id else raw_id
        last = str(p.get("lastName") or "")
        first = str(p.get("firstName") or "")
        dob = str(p.get("dob") or "")
        birth_year: int | None = None
        if dob:
            try:
                birth_year = int(dob[:4])
            except (ValueError, TypeError):
                pass
        cand = _Candidate(
            player_id=pid,
            last_norm=normalize(last),
            first_initial=first_initial(first),
            first_full=normalize(first),
            birth_year=birth_year,
        )
        r.candidates.append(cand)
        key = (cand.last_norm, cand.first_initial)
        r._by_tuple.setdefault(key, []).append(cand)
    return r


# --- Main assembly ------------------------------------------------------


def _slugify(tour: str, tournament: str, date: str, a_last: str, b_last: str) -> str:
    parts = [date, tour, normalize(tournament).replace(" ", "-"),
             normalize(a_last).replace(" ", "-"),
             normalize(b_last).replace(" ", "-")]
    return "-".join(parts)


def _pick_surface_model(bundle: dict[str, Any], tour: str, surface: str) -> dict[str, Any]:
    for m in bundle["models"]:
        if m["tour"] == tour and m["surface"] == surface:
            return m
    # Fallback to Hard if surface is unknown
    for m in bundle["models"]:
        if m["tour"] == tour and m["surface"] == "Hard":
            return m
    raise RuntimeError(f"no model for tour={tour}")


def build_upcoming_payload(
    draws: list[DrawMatch],
    model_bundle: dict[str, Any],
    meta: dict[str, Any],
    elo_rows: list[dict[str, Any]],
    players: list[dict[str, Any]],
    now: datetime,
) -> dict[str, Any]:
    elo_idx = _elo_index(elo_rows)
    pid_to_player = _players_by_pid(players)
    resolvers = {
        "atp": _build_resolver_from_players(players, "atp"),
        "wta": _build_resolver_from_players(players, "wta"),
    }
    calibration_block = model_bundle.get("calibration") or {}
    calibration_views: dict[str, inference.CalibrationView | None] = {
        tour: inference.CalibrationView.from_json(calibration_block.get(tour))
        for tour in ("atp", "wta")
    }

    out_matches: list[dict[str, Any]] = []
    for d in draws:
        resolver = resolvers.get(d.tour)
        if resolver is None:
            logger.warning("upcoming: unknown tour %s, skipping %s", d.tour, d)
            continue
        pid_a = resolver.resolve(d.player_a_last, first_full=d.player_a_first or None)
        pid_b = resolver.resolve(d.player_b_last, first_full=d.player_b_first or None)
        if not pid_a or not pid_b:
            logger.warning(
                "upcoming: unresolved names (%s / %s) for %s",
                d.player_a_last, d.player_b_last, d.tournament,
            )
            continue
        pa = pid_to_player.get(pid_a)
        pb = pid_to_player.get(pid_b)
        if not pa or not pb:
            logger.warning(
                "upcoming: resolved pids (%s, %s) missing from players.json",
                pid_a, pid_b,
            )
            continue

        fa = _build_features(pa, d.surface, elo_idx)
        fb = _build_features(pb, d.surface, elo_idx)
        surface_model = _pick_surface_model(model_bundle, d.tour, d.surface)
        tw = TOURNEY_WEIGHTS.get(d.tourney_level, 2.0)
        view = inference.TrainedModelView.from_json(surface_model)
        prob_a = inference.apply_model(
            view, fa, fb,
            tourney_weight=tw,
            calibration_curve=calibration_views.get(d.tour),
        )

        out_matches.append({
            "id": _slugify(d.tour, d.tournament, d.date, d.player_a_last, d.player_b_last),
            "date": d.date,
            "tournament": d.tournament,
            "round": d.round,
            "surface": d.surface,
            "tour": d.tour,
            "playerA": pa["slug"],
            "playerB": pb["slug"],
            "modelProbA": round(prob_a, 4),
        })

    # Miss-ratio guard across both resolvers, combined.
    total_attempts = sum(r._attempts for r in resolvers.values())
    total_misses = sum(r._misses for r in resolvers.values())
    miss_ratio = (total_misses / total_attempts) if total_attempts else 0.0
    if miss_ratio > MAX_MISS_RATIO:
        raise RuntimeError(
            f"upcoming: name resolution miss ratio {miss_ratio:.2%} "
            f"exceeds {MAX_MISS_RATIO:.0%} — aborting to prevent silent data loss",
        )

    return {
        "updatedAt": now.isoformat(),
        "modelTrainedAt": meta.get("trainedAt"),
        "source": "local (env-driven draws_fetcher)",
        "matches": sorted(out_matches, key=lambda m: (m["date"], m["tournament"], m["round"])),
        "stats": {
            "fetched": len(draws),
            "resolved": len(out_matches),
            "missRatio": round(miss_ratio, 4),
        },
    }


def write_upcoming(payload: dict[str, Any], data_dir: Path = DATA_OUT_DIR) -> Path:
    out = data_dir / "matches_upcoming.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    return out


def run(now: datetime | None = None, data_dir: Path = DATA_OUT_DIR) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    meta = load_meta(data_dir)
    check_model_freshness(meta, now)
    bundle = load_model_bundle(data_dir)
    elo_rows = load_elo(data_dir)
    players = load_players(data_dir)
    draws = draws_fetcher.fetch_all()
    payload = build_upcoming_payload(draws, bundle, meta, elo_rows, players, now)
    path = write_upcoming(payload, data_dir)
    logger.info(
        "upcoming: wrote %d matches to %s (miss ratio %.2f%%)",
        len(payload["matches"]), path, payload["stats"]["missRatio"] * 100,
    )
    return payload


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument("--allow-stale", action="store_true",
                        help="skip the model freshness check (dev only)")
    args = parser.parse_args()
    try:
        if args.allow_stale:
            # Override check by using a fake "now" close to trainedAt.
            meta = load_meta()
            trained = datetime.fromisoformat(
                meta["trainedAt"].replace("Z", "+00:00"),
            )
            run(now=trained + timedelta(hours=1))
        else:
            run()
    except Exception as exc:
        logger.error("upcoming failed: %s", exc)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
