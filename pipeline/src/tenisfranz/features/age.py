"""Age features — linear and squared to capture the prime curve."""

from __future__ import annotations

import numpy as np
import pandas as pd


def compute(matches: pd.DataFrame) -> pd.DataFrame:
    out = matches.copy()
    w_age = out["winner_age"].astype(float).fillna(25.0).to_numpy()
    l_age = out["loser_age"].astype(float).fillna(25.0).to_numpy()
    out["w_age"] = w_age
    out["l_age"] = l_age
    # centered at 25 so that younger/older show up symmetrically
    out["w_age_sq"] = (w_age - 25.0) ** 2
    out["l_age_sq"] = (l_age - 25.0) ** 2
    return out
