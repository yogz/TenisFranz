"""Bayesian head-to-head with Beta(1,1) prior."""

from __future__ import annotations

from collections import defaultdict

import numpy as np
import pandas as pd


def _key(a: str, b: str) -> tuple[str, str]:
    return (a, b) if a < b else (b, a)


def compute(matches: pd.DataFrame) -> pd.DataFrame:
    # counts[(low, high)] = (wins_by_low, wins_by_high)
    counts: dict[tuple[str, str], list[int]] = defaultdict(lambda: [0, 0])
    w_h2h = np.empty(len(matches))
    l_h2h = np.empty(len(matches))

    w_ids = matches["winner_id"].astype(str).to_numpy()
    l_ids = matches["loser_id"].astype(str).to_numpy()

    for i in range(len(matches)):
        w, l = w_ids[i], l_ids[i]
        key = _key(w, l)
        c = counts[key]
        low_wins, high_wins = c[0], c[1]
        # Beta(1,1) prior → posterior mean = (wins + 1) / (total + 2)
        total = low_wins + high_wins
        low_rate = (low_wins + 1) / (total + 2)

        if w == key[0]:
            w_h2h[i] = low_rate
            l_h2h[i] = 1.0 - low_rate
        else:
            w_h2h[i] = 1.0 - low_rate
            l_h2h[i] = low_rate

        if w == key[0]:
            c[0] += 1
        else:
            c[1] += 1

    out = matches.copy()
    out["w_h2h"] = w_h2h
    out["l_h2h"] = l_h2h
    return out
