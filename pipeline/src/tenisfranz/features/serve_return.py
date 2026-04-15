"""Rolling serve% and return-points-won% per player."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field

import numpy as np
import pandas as pd


WINDOW_DAYS = 365
DEFAULT_SERVE = 0.63
DEFAULT_RETURN = 0.37
MIN_POINTS = 200


@dataclass
class _PlayerRoll:
    # rolling window of (date, serve_pts_won, serve_pts, return_pts_won, return_pts)
    q: deque = field(default_factory=deque)
    spw: int = 0
    sp: int = 0
    rpw: int = 0
    rp: int = 0

    def purge(self, cutoff: pd.Timestamp) -> None:
        while self.q and self.q[0][0] < cutoff:
            _, spw, sp, rpw, rp = self.q.popleft()
            self.spw -= spw
            self.sp -= sp
            self.rpw -= rpw
            self.rp -= rp

    def add(self, date: pd.Timestamp, spw: int, sp: int, rpw: int, rp: int) -> None:
        self.q.append((date, spw, sp, rpw, rp))
        self.spw += spw
        self.sp += sp
        self.rpw += rpw
        self.rp += rp

    def serve_pct(self) -> float:
        if self.sp < MIN_POINTS:
            return DEFAULT_SERVE
        return self.spw / self.sp

    def return_pct(self) -> float:
        if self.rp < MIN_POINTS:
            return DEFAULT_RETURN
        return self.rpw / self.rp


def _col(matches: pd.DataFrame, name: str) -> np.ndarray:
    if name not in matches.columns:
        return np.zeros(len(matches), dtype=np.int64)
    return matches[name].fillna(0).astype(np.int64).to_numpy()


def compute(matches: pd.DataFrame, window_days: int = WINDOW_DAYS) -> pd.DataFrame:
    rolls: dict[str, _PlayerRoll] = defaultdict(_PlayerRoll)
    n = len(matches)
    w_sv = np.empty(n)
    l_sv = np.empty(n)
    w_rt = np.empty(n)
    l_rt = np.empty(n)

    dates = matches["tourney_date"].to_numpy()
    w_ids = matches["winner_id"].astype(str).to_numpy()
    l_ids = matches["loser_id"].astype(str).to_numpy()

    w_1stWon = _col(matches, "w_1stWon")
    w_2ndWon = _col(matches, "w_2ndWon")
    w_svpt = _col(matches, "w_svpt")
    l_1stWon = _col(matches, "l_1stWon")
    l_2ndWon = _col(matches, "l_2ndWon")
    l_svpt = _col(matches, "l_svpt")

    for i in range(n):
        date = pd.Timestamp(dates[i])
        cutoff = date - pd.Timedelta(days=window_days)
        w_id, l_id = w_ids[i], l_ids[i]
        rw, rl = rolls[w_id], rolls[l_id]
        rw.purge(cutoff)
        rl.purge(cutoff)
        w_sv[i] = rw.serve_pct()
        l_sv[i] = rl.serve_pct()
        w_rt[i] = rw.return_pct()
        l_rt[i] = rl.return_pct()

        w_spw = int(w_1stWon[i] + w_2ndWon[i])
        w_sp = int(w_svpt[i])
        l_spw = int(l_1stWon[i] + l_2ndWon[i])
        l_sp = int(l_svpt[i])
        # points won while returning = opponent's serve points - opponent's serve points won
        w_rpw = max(l_sp - l_spw, 0)
        l_rpw = max(w_sp - w_spw, 0)

        if w_sp > 0:
            # winner's serve line + winner's return stats (he returned l_sp points)
            rw.add(date, w_spw, w_sp, w_rpw, l_sp)
        if l_sp > 0:
            rl.add(date, l_spw, l_sp, l_rpw, w_sp)

    out = matches.copy()
    out["w_serve_pct"] = w_sv
    out["l_serve_pct"] = l_sv
    out["w_return_pct"] = w_rt
    out["l_return_pct"] = l_rt
    return out
