"""Minutes played and matches in recent days."""

from __future__ import annotations

from collections import defaultdict, deque

import numpy as np
import pandas as pd


MINUTES_WINDOW_DAYS = 7
MATCHES_WINDOW_DAYS = 14


def compute(matches: pd.DataFrame) -> pd.DataFrame:
    # each player's recent match log: deque of (date, minutes)
    logs: dict[str, deque] = defaultdict(deque)

    w_mins = np.zeros(len(matches))
    l_mins = np.zeros(len(matches))
    w_n = np.zeros(len(matches))
    l_n = np.zeros(len(matches))

    dates = matches["tourney_date"].to_numpy()
    w_ids = matches["winner_id"].astype(str).to_numpy()
    l_ids = matches["loser_id"].astype(str).to_numpy()
    mins_col = matches["minutes"].fillna(90).astype(float).to_numpy()

    for i in range(len(matches)):
        date = pd.Timestamp(dates[i])
        w, l = w_ids[i], l_ids[i]
        for pid, mins_arr, n_arr in ((w, w_mins, w_n), (l, l_mins, l_n)):
            q = logs[pid]
            while q and (date - q[0][0]).days > MATCHES_WINDOW_DAYS:
                q.popleft()
            mins_total = sum(m for d, m in q if (date - d).days <= MINUTES_WINDOW_DAYS)
            mins_arr[i] = mins_total
            n_arr[i] = len(q)
        # update logs with this match
        logs[w].append((date, mins_col[i]))
        logs[l].append((date, mins_col[i]))

    out = matches.copy()
    # combine minutes and match count into a single fatigue scalar
    out["w_fatigue"] = w_mins / 60.0 + w_n
    out["l_fatigue"] = l_mins / 60.0 + l_n
    return out
