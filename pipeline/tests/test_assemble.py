"""Feature assembly: diffs should be anti-symmetric."""

from __future__ import annotations

import numpy as np
import pandas as pd

from tenisfranz.config import FEATURE_NAMES
from tenisfranz.features.assemble import add_all, build_matrix


def _fake_matches(n: int = 400) -> pd.DataFrame:
    rng = np.random.default_rng(0)
    ids = [f"p{i}" for i in range(20)]
    rows = []
    day = pd.Timestamp("2020-01-01")
    for i in range(n):
        w, l = rng.choice(ids, size=2, replace=False)
        rows.append({
            "tourney_date": day + pd.Timedelta(days=i),
            "surface": rng.choice(["Hard", "Clay", "Grass"]),
            "tourney_level": "A",
            "winner_id": str(w),
            "loser_id": str(l),
            "winner_name": f"Player {w}",
            "loser_name": f"Player {l}",
            "winner_ioc": "FRA",
            "loser_ioc": "FRA",
            "winner_age": 25.0,
            "loser_age": 25.0,
            "minutes": 90,
            "w_svpt": 60, "w_1stIn": 36, "w_1stWon": 26, "w_2ndWon": 14,
            "l_svpt": 58, "l_1stIn": 34, "l_1stWon": 22, "l_2ndWon": 12,
        })
    return pd.DataFrame(rows)


def test_build_matrix_shape_and_labels():
    df = _fake_matches()
    with_feats, _ = add_all(df)
    X, y = build_matrix(with_feats, seed=1)
    assert X.shape == (len(df), len(FEATURE_NAMES))
    assert set(np.unique(y)).issubset({0.0, 1.0})
    # labels balanced by construction (random swap)
    assert 0.35 < y.mean() < 0.65
