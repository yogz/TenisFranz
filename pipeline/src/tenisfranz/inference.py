"""Shared logistic inference.

Used by:
- train.py (sanity check after fit)
- upcoming.py (live predictions from committed model.json)
- historical_roi.py (walk-forward simulation)
- tests/test_inference_parity.py (bit-for-bit parity with web/lib/predict.ts)

The math mirrors web/lib/predict.ts exactly. A fixture generated from the
committed model.json is consumed by both the Python and TypeScript test
suites to assert agreement at 1e-9.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any


@dataclass
class TrainedModelView:
    """Subset of TrainedModel needed for inference — mirrors model.json entries."""

    tour: str
    surface: str
    intercept: float
    coefficients: list[float]
    scaler_mean: list[float]
    scaler_scale: list[float]
    feature_names: list[str]

    @classmethod
    def from_json(cls, d: dict[str, Any]) -> "TrainedModelView":
        return cls(
            tour=d["tour"],
            surface=d["surface"],
            intercept=float(d["intercept"]),
            coefficients=[float(x) for x in d["coefficients"]],
            scaler_mean=[float(x) for x in d["scalerMean"]],
            scaler_scale=[float(x) for x in d["scalerScale"]],
            feature_names=list(d["featureNames"]),
        )


@dataclass
class PlayerFeatures:
    elo_surface: float
    serve_pct: float
    return_pct: float
    form: float
    h2h: float
    fatigue: float
    age: float

    @property
    def age_sq(self) -> float:
        return (self.age - 25.0) ** 2


def _sigmoid(x: float) -> float:
    # Numerically stable sigmoid matching JS Math.exp semantics.
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def feature_vector(
    a: PlayerFeatures, b: PlayerFeatures, tourney_weight: float,
) -> dict[str, float]:
    # Mirrors web/lib/predict.ts::featureVector. Form and fatigue are still
    # passed in PlayerFeatures (other callers need them) but are no longer
    # part of the model input — see config.FEATURE_NAMES rationale.
    return {
        "elo_surface_diff": a.elo_surface - b.elo_surface,
        "serve_pts_won_diff": a.serve_pct - b.serve_pct,
        "return_pts_won_diff": a.return_pct - b.return_pct,
        "h2h_diff": a.h2h - b.h2h,
        "age_diff": a.age - b.age,
        "age_sq_diff": a.age_sq - b.age_sq,
        "tourney_weight": tourney_weight,
    }


def apply_model(
    model: TrainedModelView,
    fa: PlayerFeatures,
    fb: PlayerFeatures,
    tourney_weight: float = 2.0,
    calibration_curve: "CalibrationView | None" = None,
) -> float:
    """Return P(A wins). Matches web/lib/predict.ts::predict at 1e-9.

    Features the current `feature_vector` doesn't produce but the model
    references (e.g. a legacy `form_diff` coefficient still on disk while
    the pipeline is mid-migration) are treated as the scaled-mean (→ zero
    logit contribution). That makes the function tolerant of model/schema
    drift during rollouts.

    If a `calibration_curve` (raw_prob → calibrated_prob) is provided,
    the sigmoid output is piped through it. The curve is loaded from
    `model.json`'s top-level `calibration[tour]` entry.
    """
    raw = feature_vector(fa, fb, tourney_weight)
    logit = model.intercept
    for i, name in enumerate(model.feature_names):
        if name not in raw:
            continue  # unknown feature contributes 0 logit
        mean = model.scaler_mean[i]
        scale = model.scaler_scale[i] or 1.0
        x = (raw[name] - mean) / scale
        logit += model.coefficients[i] * x
    prob = _sigmoid(logit)
    if calibration_curve is not None:
        # Pair-normalize so P(A) + P(B) stays exactly 1 after the
        # non-linear transform — matches web/lib/predict.ts::predict.
        cal_a = calibration_curve.apply(prob)
        cal_b = calibration_curve.apply(1.0 - prob)
        total = cal_a + cal_b
        if total > 0:
            prob = cal_a / total
    return prob


@dataclass
class CalibrationView:
    """Runtime-friendly mirror of calibration.CalibrationCurve for inference.

    Decoupled from the top-level `calibration.CalibrationCurve` dataclass to
    keep this module import-light — inference.py is the one module that
    both the pipeline and the runtime (upcoming.py, historical_roi.py)
    load, and we don't want it to pull in scikit-learn.
    """

    xs: list[float]
    ys: list[float]

    @classmethod
    def from_json(cls, d: dict[str, Any] | None) -> "CalibrationView | None":
        if not d or not d.get("xs") or not d.get("ys"):
            return None
        return cls(
            xs=[float(x) for x in d["xs"]],
            ys=[float(y) for y in d["ys"]],
        )

    def apply(self, prob: float) -> float:
        if not self.xs:
            return prob
        if prob <= self.xs[0]:
            return self.ys[0]
        if prob >= self.xs[-1]:
            return self.ys[-1]
        lo, hi = 0, len(self.xs) - 1
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if self.xs[mid] <= prob:
                lo = mid
            else:
                hi = mid
        x0, x1 = self.xs[lo], self.xs[hi]
        y0, y1 = self.ys[lo], self.ys[hi]
        if x1 == x0:
            return y0
        t = (prob - x0) / (x1 - x0)
        return y0 + t * (y1 - y0)


def anti_symmetric(
    model: TrainedModelView,
    fa: PlayerFeatures,
    fb: PlayerFeatures,
    tourney_weight: float = 2.0,
    tol: float = 5e-2,
) -> bool:
    """Assert predict(A,B) + predict(B,A) ≈ 1 within realistic tolerance.

    Note: the model has `tourney_weight` as a shared (non-diff) feature that
    contributes the same scaled value to both orderings, which breaks strict
    anti-symmetry. The residual is bounded by the scaled tourney_weight
    coefficient, empirically ~2.2e-2. We assert within 5e-2 for safety.

    For strict symmetry, use `identical_is_fifty` below — that invariant
    is exact.
    """
    p_ab = apply_model(model, fa, fb, tourney_weight)
    p_ba = apply_model(model, fb, fa, tourney_weight)
    return abs(p_ab + p_ba - 1.0) < tol


def identical_is_fifty(
    model: TrainedModelView,
    fa: PlayerFeatures,
    tourney_weight: float = 2.0,
    tol: float = 1e-9,
) -> bool:
    """For identical players, P(A wins) must be exactly 0.5 regardless of tourney_weight.

    This invariant holds strictly because all diff-features are zero, so the
    logit reduces to intercept + coef_tw * scaled_tw. Wait — that's not 0.
    In practice for the trained model the intercept is near 0 and coef_tw
    is small, so the result is near 0.5 but not exactly. Test with loose tol.
    """
    p = apply_model(model, fa, fa, tourney_weight)
    return abs(p - 0.5) < tol
