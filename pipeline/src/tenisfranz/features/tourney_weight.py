"""Tournament importance weighting — common to both players per match."""

from __future__ import annotations

import pandas as pd

from ..config import TOURNEY_WEIGHTS


def compute(matches: pd.DataFrame) -> pd.DataFrame:
    out = matches.copy()
    out["tourney_weight"] = (
        out["tourney_level"].map(TOURNEY_WEIGHTS).fillna(TOURNEY_WEIGHTS["A"])
    )
    return out
