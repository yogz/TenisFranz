"""Walk-forward backtest: train on up-to-year-T, evaluate on T+1."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss
from sklearn.preprocessing import StandardScaler

from .config import FEATURE_NAMES, SURFACES
from .features.assemble import build_matrix


@dataclass
class BacktestMetrics:
    tour: str
    accuracy: float
    log_loss: float
    brier: float
    n_test: int
    by_year: list[dict]
    calibration: list[dict]

    def to_dict(self) -> dict:
        return {
            "tour": self.tour,
            "accuracy": self.accuracy,
            "logLoss": self.log_loss,
            "brier": self.brier,
            "nTest": self.n_test,
            "byYear": self.by_year,
            "calibration": self.calibration,
        }


def _calibration_curve(y: np.ndarray, p: np.ndarray, bins: int = 10) -> list[dict]:
    edges = np.linspace(0.0, 1.0, bins + 1)
    out = []
    for i in range(bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (p >= lo) & (p < hi) if i < bins - 1 else (p >= lo) & (p <= hi)
        if mask.sum() == 0:
            continue
        out.append({
            "bin": (lo + hi) / 2.0,
            "observed": float(y[mask].mean()),
            "predicted": float(p[mask].mean()),
            "count": int(mask.sum()),
        })
    return out


def run(matches_with_features: pd.DataFrame, tour: str, min_train_years: int = 3) -> BacktestMetrics:
    df = matches_with_features.copy()
    df["year"] = df["tourney_date"].dt.year
    years = sorted(df["year"].unique())
    if len(years) <= min_train_years:
        raise RuntimeError(f"not enough years for backtest on {tour}")

    all_preds: list[np.ndarray] = []
    all_true: list[np.ndarray] = []
    by_year: list[dict] = []

    for test_year in years[min_train_years:]:
        train = df[df["year"] < test_year]
        test = df[df["year"] == test_year]
        if len(train) < 500 or len(test) < 50:
            continue

        for surface in SURFACES:
            tr_s = train[train["surface"] == surface]
            te_s = test[test["surface"] == surface]
            if len(tr_s) < 200 or len(te_s) < 20:
                continue
            X_tr, y_tr = build_matrix(tr_s, seed=17)
            X_te, y_te = build_matrix(te_s, seed=17)
            scaler = StandardScaler().fit(X_tr)
            clf = LogisticRegression(C=1.0, max_iter=1000).fit(scaler.transform(X_tr), y_tr)
            p = clf.predict_proba(scaler.transform(X_te))[:, 1]
            all_preds.append(p)
            all_true.append(y_te)
            by_year.append({
                "year": int(test_year),
                "surface": surface,
                "accuracy": float(((p > 0.5) == y_te).mean()),
                "n": int(len(te_s)),
            })

    y = np.concatenate(all_true)
    p = np.concatenate(all_preds)
    return BacktestMetrics(
        tour=tour,
        accuracy=float(((p > 0.5) == y).mean()),
        log_loss=float(log_loss(y, p, labels=[0.0, 1.0])),
        brier=float(brier_score_loss(y, p)),
        n_test=int(len(y)),
        by_year=by_year,
        calibration=_calibration_curve(y, p),
    )
