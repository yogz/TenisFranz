"""Write JSON artifacts into web/public/data/."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd

from .backtest import BacktestMetrics
from .config import DATA_OUT_DIR, FEATURE_NAMES, SURFACES
from .features.elo_surface import SurfaceEloState
from .train import TrainedModel


def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def _write(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))


def export_models(models_by_tour: dict[str, list[TrainedModel]]) -> None:
    payload = {
        "featureNames": list(FEATURE_NAMES),
        "surfaces": list(SURFACES),
        "models": [m.to_dict() for ms in models_by_tour.values() for m in ms],
    }
    _write(DATA_OUT_DIR / "model.json", payload)


def export_backtest(metrics_by_tour: dict[str, BacktestMetrics]) -> None:
    payload = {tour: m.to_dict() for tour, m in metrics_by_tour.items()}
    _write(DATA_OUT_DIR / "backtest.json", payload)


def export_players_and_elo(
    tours_with_features: dict[str, pd.DataFrame],
    elo_states: dict[str, SurfaceEloState],
) -> None:
    players: list[dict] = []
    elo_rows: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for tour, df in tours_with_features.items():
        # Take each player's *latest* row to pick up their current age / country
        for side in ("winner", "loser"):
            cols = [f"{side}_id", f"{side}_name", f"{side}_ioc", f"{side}_age", "tourney_date"]
            sub = df[cols].rename(
                columns={
                    f"{side}_id": "player_id",
                    f"{side}_name": "name",
                    f"{side}_ioc": "country",
                    f"{side}_age": "age",
                }
            )
            sub["tour"] = tour
            sub = sub.sort_values("tourney_date").groupby("player_id", as_index=False).tail(1)
            for row in sub.itertuples(index=False):
                key = (tour, str(row.player_id))
                if key in seen:
                    continue
                seen.add(key)
                name = str(row.name)
                players.append({
                    "id": f"{tour}-{row.player_id}",
                    "slug": _slugify(f"{tour}-{name}"),
                    "name": name,
                    "country": (str(row.country) if pd.notna(row.country) else None),
                    "age": (float(row.age) if pd.notna(row.age) else None),
                    "tour": tour,
                })

        state = elo_states[tour]
        # emit latest Elo per (player, surface)
        for surface in SURFACES:
            for pid, rating in state.rating[surface].items():
                elo_rows.append({
                    "id": f"{tour}-{pid}",
                    "surface": surface,
                    "elo": round(rating, 2),
                    "matches": state.matches[surface].get(pid, 0),
                })

    # Attach a rank per tour by best-surface Elo
    elo_df = pd.DataFrame(elo_rows)
    if not elo_df.empty:
        best = elo_df.sort_values("elo", ascending=False).groupby("id", as_index=False).head(1)
        best["rank_key"] = best["elo"].rank(ascending=False, method="dense").astype(int)
        rank_map = dict(zip(best["id"], best["rank_key"]))
        for p in players:
            p["rank"] = int(rank_map.get(p["id"], 9999))
        players.sort(key=lambda p: (p["tour"], p["rank"]))

    _write(DATA_OUT_DIR / "players.json", players)
    _write(DATA_OUT_DIR / "elo.json", elo_rows)


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
