"""Exponentially weighted recent win rate (half-life 60 days)."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from math import exp, log

import numpy as np
import pandas as pd


HALF_LIFE_DAYS = 60.0
DEFAULT_FORM = 0.5


@dataclass
class _Form:
    wins: float = 0.0
    total: float = 0.0
    last_date: pd.Timestamp | None = None

    def _decay_to(self, date: pd.Timestamp) -> None:
        if self.last_date is None:
            self.last_date = date
            return
        dt_days = (date - self.last_date).days
        if dt_days <= 0:
            return
        decay = exp(-log(2.0) * dt_days / HALF_LIFE_DAYS)
        self.wins *= decay
        self.total *= decay
        self.last_date = date

    def value(self, date: pd.Timestamp) -> float:
        self._decay_to(date)
        if self.total < 0.5:
            return DEFAULT_FORM
        return self.wins / self.total

    def update(self, date: pd.Timestamp, won: bool) -> None:
        self._decay_to(date)
        self.total += 1.0
        if won:
            self.wins += 1.0


def compute(matches: pd.DataFrame) -> pd.DataFrame:
    forms: dict[str, _Form] = defaultdict(_Form)
    w_form = np.empty(len(matches))
    l_form = np.empty(len(matches))

    dates = matches["tourney_date"].to_numpy()
    w_ids = matches["winner_id"].astype(str).to_numpy()
    l_ids = matches["loser_id"].astype(str).to_numpy()

    for i in range(len(matches)):
        date = pd.Timestamp(dates[i])
        w, l = w_ids[i], l_ids[i]
        w_form[i] = forms[w].value(date)
        l_form[i] = forms[l].value(date)
        forms[w].update(date, True)
        forms[l].update(date, False)

    out = matches.copy()
    out["w_form"] = w_form
    out["l_form"] = l_form
    return out
