"""Train one logistic regression per (tour, surface) triple."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from .config import FEATURE_NAMES, SURFACES
from .features.assemble import add_all, build_matrix
from .features.elo_surface import SurfaceEloState


@dataclass
class TrainedModel:
    tour: str
    surface: str
    intercept: float
    coefficients: list[float]
    scaler_mean: list[float]
    scaler_scale: list[float]
    feature_names: list[str]
    n_train: int
    trained_at: str

    def to_dict(self) -> dict:
        return {
            "tour": self.tour,
            "surface": self.surface,
            "intercept": self.intercept,
            "coefficients": self.coefficients,
            "scalerMean": self.scaler_mean,
            "scalerScale": self.scaler_scale,
            "featureNames": self.feature_names,
            "nTrain": self.n_train,
            "trainedAt": self.trained_at,
        }


def train_one(
    matches_with_features: pd.DataFrame, tour: str, surface: str
) -> TrainedModel | None:
    sub = matches_with_features[matches_with_features["surface"] == surface]
    if len(sub) < 500:
        return None

    X, y = build_matrix(sub)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    clf = LogisticRegression(C=1.0, max_iter=1000, solver="lbfgs")
    clf.fit(Xs, y)

    return TrainedModel(
        tour=tour,
        surface=surface,
        intercept=float(clf.intercept_[0]),
        coefficients=[float(c) for c in clf.coef_[0]],
        scaler_mean=[float(m) for m in scaler.mean_],
        scaler_scale=[float(s) for s in scaler.scale_],
        feature_names=list(FEATURE_NAMES),
        n_train=int(len(sub)),
        trained_at=datetime.now(timezone.utc).isoformat(),
    )


def train_all(
    tours: dict[str, pd.DataFrame],
) -> tuple[dict[str, list[TrainedModel]], dict[str, SurfaceEloState]]:
    """Return ({tour: [TrainedModel per surface]}, {tour: SurfaceEloState}).

    `tours` is mutated in place so each DataFrame carries the computed feature
    columns — downstream backtest and export consume that.
    """
    models_out: dict[str, list[TrainedModel]] = {}
    elo_out: dict[str, SurfaceEloState] = {}
    for tour, df in tours.items():
        with_feats, elo_state = add_all(df)
        tours[tour] = with_feats
        elo_out[tour] = elo_state
        models = [m for surface in SURFACES if (m := train_one(with_feats, tour, surface))]
        models_out[tour] = models
    return models_out, elo_out
