"""Chain every feature module and build the modelling matrix.

The model is trained on *differences* (playerA − playerB). To get a balanced
training set we randomize which player is "A" for each row, so the model can't
cheat by always putting the winner first. Labels become 1 if player A won.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from ..config import FEATURE_NAMES
from . import age, elo_surface, fatigue, form, h2h_bayes, serve_return, tourney_weight


def add_all(matches: pd.DataFrame) -> tuple[pd.DataFrame, elo_surface.SurfaceEloState]:
    df, elo_state = elo_surface.compute(matches)
    df = serve_return.compute(df)
    df = form.compute(df)
    df = h2h_bayes.compute(df)
    df = fatigue.compute(df)
    df = age.compute(df)
    df = tourney_weight.compute(df)
    return df, elo_state


def build_matrix(matches_with_features: pd.DataFrame, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """Return (X, y) where X.shape == (N, 9) and y is 0/1.

    Feature ordering matches `config.FEATURE_NAMES`.
    """
    rng = np.random.default_rng(seed)
    swap = rng.random(len(matches_with_features)) < 0.5

    def diff(w_col: str, l_col: str) -> np.ndarray:
        w = matches_with_features[w_col].to_numpy(dtype=np.float64)
        l = matches_with_features[l_col].to_numpy(dtype=np.float64)
        base = w - l
        return np.where(swap, -base, base)

    feats = {
        "elo_surface_diff": diff("w_elo_surface", "l_elo_surface"),
        "serve_pts_won_diff": diff("w_serve_pct", "l_serve_pct"),
        "return_pts_won_diff": diff("w_return_pct", "l_return_pct"),
        "form_diff": diff("w_form", "l_form"),
        "h2h_diff": diff("w_h2h", "l_h2h"),
        "fatigue_diff": diff("w_fatigue", "l_fatigue"),
        "age_diff": diff("w_age", "l_age"),
        "age_sq_diff": diff("w_age_sq", "l_age_sq"),
        "tourney_weight": matches_with_features["tourney_weight"].to_numpy(dtype=np.float64),
    }
    X = np.column_stack([feats[name] for name in FEATURE_NAMES])
    y = np.where(swap, 0.0, 1.0)  # winner is A unless swapped
    return X, y
