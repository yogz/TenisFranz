"""Per-player career stats computed from the matches frame."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

import pandas as pd

from .config import SURFACES


@dataclass
class PlayerCareer:
    wins: int = 0
    losses: int = 0
    titles: int = 0
    by_surface: dict[str, list[int]] = field(
        default_factory=lambda: {s: [0, 0] for s in SURFACES}
    )  # [wins, losses]
    last_results: list[str] = field(default_factory=list)  # "W" | "L"
    peak_elo_surface: dict[str, float] = field(default_factory=lambda: {s: 1500.0 for s in SURFACES})
    last_match_date: str | None = None
    last_tournaments: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        total = self.wins + self.losses
        return {
            "wins": self.wins,
            "losses": self.losses,
            "winPct": round(self.wins / total, 4) if total else 0.0,
            "titles": self.titles,
            "bySurface": {
                s: {
                    "wins": v[0],
                    "losses": v[1],
                    "winPct": round(v[0] / (v[0] + v[1]), 4) if (v[0] + v[1]) else 0.0,
                }
                for s, v in self.by_surface.items()
            },
            "peakEloSurface": {s: round(v, 2) for s, v in self.peak_elo_surface.items()},
            "last10": self.last_results[-10:],
            "lastMatchDate": self.last_match_date,
            "lastTournaments": self.last_tournaments[-5:],
        }


def compute_career(matches_with_features: pd.DataFrame) -> dict[str, PlayerCareer]:
    """Walk matches chronologically and build per-player career summaries.

    `matches_with_features` must include `w_elo_surface` / `l_elo_surface`.
    """
    careers: dict[str, PlayerCareer] = defaultdict(PlayerCareer)

    dates = matches_with_features["tourney_date"].to_numpy()
    surfaces = matches_with_features["surface"].to_numpy()
    w_ids = matches_with_features["winner_id"].astype(str).to_numpy()
    l_ids = matches_with_features["loser_id"].astype(str).to_numpy()
    rounds = matches_with_features["round"].fillna("").astype(str).to_numpy()
    tourneys = matches_with_features["tourney_name"].fillna("").astype(str).to_numpy()
    w_elo = matches_with_features["w_elo_surface"].to_numpy()
    l_elo = matches_with_features["l_elo_surface"].to_numpy()

    for i in range(len(matches_with_features)):
        date = pd.Timestamp(dates[i]).strftime("%Y-%m-%d")
        s = surfaces[i]
        w, l = w_ids[i], l_ids[i]
        cw, cl = careers[w], careers[l]

        cw.wins += 1
        cl.losses += 1
        cw.by_surface[s][0] += 1
        cl.by_surface[s][1] += 1
        cw.last_results.append("W")
        cl.last_results.append("L")
        cw.last_match_date = date
        cl.last_match_date = date

        if rounds[i] == "F":
            cw.titles += 1
            cw.last_tournaments.append(tourneys[i])

        # Peak Elo at match time is max(current, previous peak).
        # The match row has pre-match Elo; after the update the rating is higher
        # only if they won. Use pre-match as a lower bound; that's fine for peak.
        if w_elo[i] > cw.peak_elo_surface[s]:
            cw.peak_elo_surface[s] = float(w_elo[i])
        if l_elo[i] > cl.peak_elo_surface[s]:
            cl.peak_elo_surface[s] = float(l_elo[i])

    return careers
