"""Per-surface Elo with K-factor decay."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from ..config import SURFACES


@dataclass
class SurfaceEloState:
    """Running Elo tables, one per surface. Pre-match lookup, update after."""

    start: float = 1500.0
    k_base: float = 250.0
    k_offset: int = 5
    k_shape: float = 0.4

    rating: dict[str, dict[str, float]] = field(default_factory=lambda: {s: {} for s in SURFACES})
    matches: dict[str, dict[str, int]] = field(default_factory=lambda: {s: {} for s in SURFACES})

    def get(self, surface: str, player_id: str) -> float:
        return self.rating[surface].get(player_id, self.start)

    def _k(self, surface: str, player_id: str) -> float:
        n = self.matches[surface].get(player_id, 0)
        return self.k_base / (n + self.k_offset) ** self.k_shape

    def update(self, surface: str, winner: str, loser: str) -> tuple[float, float]:
        rw = self.get(surface, winner)
        rl = self.get(surface, loser)
        expected_w = 1.0 / (1.0 + 10.0 ** ((rl - rw) / 400.0))
        kw = self._k(surface, winner)
        kl = self._k(surface, loser)
        self.rating[surface][winner] = rw + kw * (1.0 - expected_w)
        self.rating[surface][loser] = rl + kl * (0.0 - (1.0 - expected_w))
        self.matches[surface][winner] = self.matches[surface].get(winner, 0) + 1
        self.matches[surface][loser] = self.matches[surface].get(loser, 0) + 1
        return rw, rl


def compute(matches: pd.DataFrame) -> tuple[pd.DataFrame, SurfaceEloState]:
    """Add columns `w_elo_surface` and `l_elo_surface` (pre-match values).

    Returns the matches frame with added columns and the final state, so callers
    can emit the current Elo table as JSON.
    """
    state = SurfaceEloState()
    w_elo = np.empty(len(matches), dtype=np.float64)
    l_elo = np.empty(len(matches), dtype=np.float64)

    w_ids = matches["winner_id"].astype(str).to_numpy()
    l_ids = matches["loser_id"].astype(str).to_numpy()
    surfaces = matches["surface"].to_numpy()

    for i in range(len(matches)):
        s = surfaces[i]
        w, l = w_ids[i], l_ids[i]
        rw, rl = state.get(s, w), state.get(s, l)
        w_elo[i] = rw
        l_elo[i] = rl
        state.update(s, w, l)

    out = matches.copy()
    out["w_elo_surface"] = w_elo
    out["l_elo_surface"] = l_elo
    return out, state
