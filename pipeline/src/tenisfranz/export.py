"""Write JSON artifacts into web/public/data/."""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

import pandas as pd

from .backtest import BacktestMetrics
from .config import DATA_OUT_DIR, FEATURE_NAMES, SURFACES
from .features.elo_surface import SurfaceEloState
from .ioc import ioc_to_iso
from .stats import PlayerCareer
from .train import TrainedModel


def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def _write(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))


def _parse_dob(dob: object) -> str | None:
    if dob is None or (isinstance(dob, float) and pd.isna(dob)):
        return None
    s = str(dob).strip()
    if not s or s == "nan":
        return None
    # Sackmann uses YYYYMMDD as a string
    if len(s) == 8 and s.isdigit():
        return f"{s[0:4]}-{s[4:6]}-{s[6:8]}"
    return None


def _age_from_dob(dob_iso: str | None, ref: datetime | None = None) -> float | None:
    if not dob_iso:
        return None
    try:
        dt = datetime.fromisoformat(dob_iso)
    except ValueError:
        return None
    ref = ref or datetime.utcnow()
    return round((ref - dt).days / 365.25, 1)


def export_models(
    models_by_tour: dict[str, list[TrainedModel]],
    metrics_by_tour: dict[str, BacktestMetrics] | None = None,
) -> None:
    """Write model.json with coefficients, scaler state, feature names, and
    (optionally) the per-tour isotonic calibration curve fitted during the
    backtest pass. The calibration block is a plain dict keyed by tour so
    the web bundle can look it up at inference time.
    """
    calibration_block: dict[str, dict] = {}
    if metrics_by_tour:
        for tour, m in metrics_by_tour.items():
            if m.calibration_curve is not None:
                calibration_block[tour] = m.calibration_curve.to_dict()

    payload = {
        "featureNames": list(FEATURE_NAMES),
        "surfaces": list(SURFACES),
        "models": [m.to_dict() for ms in models_by_tour.values() for m in ms],
        "calibration": calibration_block,
    }
    _write(DATA_OUT_DIR / "model.json", payload)


def export_backtest(metrics_by_tour: dict[str, BacktestMetrics]) -> None:
    payload = {tour: m.to_dict() for tour, m in metrics_by_tour.items()}
    _write(DATA_OUT_DIR / "backtest.json", payload)


def build_players(
    tours_with_features: dict[str, pd.DataFrame],
    elo_states: dict[str, SurfaceEloState],
    player_meta: dict[str, pd.DataFrame],
    careers: dict[str, dict[str, PlayerCareer]],
    photos_by_qid: dict[str, str],
) -> list[dict]:
    """Assemble the rich `players.json` payload.

    Only players that appear in the matches frame are kept, so list size stays bounded.
    """
    players: list[dict] = []

    for tour, df in tours_with_features.items():
        meta_df = player_meta[tour]
        meta_idx = meta_df.set_index("player_id")
        # players we've actually seen in the matches window (winners ∪ losers)
        seen_ids = set(df["winner_id"].astype(str)).union(df["loser_id"].astype(str))
        state = elo_states[tour]
        tour_careers = careers.get(tour, {})

        for pid in seen_ids:
            career = tour_careers.get(pid)
            if not career:
                continue
            raw = meta_idx.loc[pid].to_dict() if pid in meta_idx.index else {}
            # meta CSV comes in as strings but missing values become NaN floats — normalize
            def _s(key: str) -> str | None:
                v = raw.get(key)
                if v is None:
                    return None
                if isinstance(v, float) and pd.isna(v):
                    return None
                s = str(v).strip()
                return s or None

            first = _s("name_first") or ""
            last = _s("name_last") or ""
            name = f"{first} {last}".strip() or f"Player {pid}"
            dob_iso = _parse_dob(_s("dob"))
            age = _age_from_dob(dob_iso)
            ioc = _s("ioc")
            height_str = _s("height")
            try:
                height_cm = int(float(height_str)) if height_str else None
            except ValueError:
                height_cm = None
            hand = (_s("hand") or "").upper() or None
            qid = _s("wikidata_id")
            if qid and not qid.startswith("Q"):
                qid = None
            photo = photos_by_qid.get(qid) if qid else None

            current_elo = {s: round(state.get(s, pid), 2) for s in SURFACES}
            matches_by_surface = {s: state.matches[s].get(pid, 0) for s in SURFACES}

            players.append({
                "id": f"{tour}-{pid}",
                "slug": _slugify(f"{tour}-{name}"),
                "name": name,
                "firstName": first or None,
                "lastName": last or None,
                "country": ioc,
                "countryIso": ioc_to_iso(ioc),
                "hand": hand if hand in {"R", "L", "A"} else None,
                "heightCm": height_cm,
                "dob": dob_iso,
                "age": age,
                "tour": tour,
                "wikidataId": qid,
                "photoUrl": photo,
                "currentEloSurface": current_elo,
                "matchesBySurface": matches_by_surface,
                "career": career.to_dict(),
            })

    # Rank per tour by best-surface Elo
    by_tour: dict[str, list[dict]] = {}
    for p in players:
        by_tour.setdefault(p["tour"], []).append(p)
    out: list[dict] = []
    for tour, lst in by_tour.items():
        lst.sort(key=lambda p: max(p["currentEloSurface"].values()), reverse=True)
        for i, p in enumerate(lst, start=1):
            p["rank"] = i
            out.append(p)
    return out


def export_players(players: list[dict]) -> None:
    _write(DATA_OUT_DIR / "players.json", players)


def export_elo(elo_states: dict[str, SurfaceEloState]) -> None:
    rows: list[dict] = []
    for tour, state in elo_states.items():
        for surface in SURFACES:
            for pid, rating in state.rating[surface].items():
                rows.append({
                    "id": f"{tour}-{pid}",
                    "surface": surface,
                    "elo": round(rating, 2),
                    "matches": state.matches[surface].get(pid, 0),
                })
    _write(DATA_OUT_DIR / "elo.json", rows)


def export_h2h(h2h_by_player: dict[str, list[dict]]) -> None:
    _write(DATA_OUT_DIR / "h2h.json", h2h_by_player)


def export_meta(year_from: int, year_to: int, trained_at: str) -> None:
    _write(
        DATA_OUT_DIR / "meta.json",
        {
            "yearFrom": year_from,
            "yearTo": year_to,
            "trainedAt": trained_at,
            "featureNames": list(FEATURE_NAMES),
        },
    )
