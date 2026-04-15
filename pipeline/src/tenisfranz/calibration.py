"""Isotonic calibration for model probabilities.

Motivation
----------
A logistic regression is well-calibrated only under strong assumptions
(link function is correct, features are linearly related to the logit).
In practice on tennis matches the model systematically under-confidences
near the extremes (it thinks Nadal-on-clay vs a journeyman is 75% when
the actual rate is ~90%).

Isotonic regression is a non-parametric monotone transform mapping
raw_prob → calibrated_prob. We fit it on the walk-forward out-of-sample
predictions aggregated across all backtest years, so it sees the same
prediction distribution the live site will serve.

Output
------
A list of `(x, y)` breakpoints forming a monotone piecewise-linear curve.
Inference is a simple O(log N) binary search + linear interpolation,
trivially serializable and re-implementable in TypeScript.

Serialization target: ~25 breakpoints per tour (scipy's IsotonicRegression
typically gives ~30–60 after deduplication; we bin to 25 for JSON size).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
from sklearn.isotonic import IsotonicRegression

MAX_BREAKPOINTS = 25


@dataclass
class CalibrationCurve:
    """Monotone piecewise-linear map [0,1] → [0,1].

    `xs` and `ys` are both sorted ascending in `xs`, share the same length,
    and form a non-decreasing `ys` sequence (isotonic property).
    """

    xs: list[float]
    ys: list[float]

    def to_dict(self) -> dict:
        return {
            "xs": [round(x, 6) for x in self.xs],
            "ys": [round(y, 6) for y in self.ys],
        }

    @classmethod
    def from_dict(cls, d: dict) -> "CalibrationCurve":
        return cls(
            xs=[float(x) for x in d["xs"]],
            ys=[float(y) for y in d["ys"]],
        )

    @classmethod
    def identity(cls) -> "CalibrationCurve":
        """No-op calibration — 0→0, 1→1 linear interpolation."""
        return cls(xs=[0.0, 1.0], ys=[0.0, 1.0])

    def apply(self, prob: float) -> float:
        """Interpolate a raw probability through the calibration curve.

        Out-of-range inputs are clamped to [xs[0], xs[-1]]. The calibration
        is trained on probabilities actually produced by the model, so
        values outside that range would come from an unfamiliar
        distribution anyway — clamping is the honest thing to do.
        """
        if not self.xs:
            return prob
        if prob <= self.xs[0]:
            return self.ys[0]
        if prob >= self.xs[-1]:
            return self.ys[-1]
        # Binary search for the right bin.
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


def fit(
    probs: Iterable[float],
    labels: Iterable[float],
    max_breakpoints: int = MAX_BREAKPOINTS,
) -> CalibrationCurve:
    """Fit an isotonic regression and return a compact breakpoint curve.

    `probs` are raw model probabilities and `labels` are 0/1 outcomes.
    The curve has at most `max_breakpoints` breakpoints (sklearn can
    return hundreds; we downsample uniformly in probability space).
    """
    p = np.asarray(list(probs), dtype=np.float64)
    y = np.asarray(list(labels), dtype=np.float64)
    if len(p) < 50:
        # Not enough signal to fit a meaningful curve — fall back to identity.
        return CalibrationCurve.identity()

    clf = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    clf.fit(p, y)

    # Sample the fitted curve at `max_breakpoints` evenly spaced probs.
    xs = np.linspace(0.0, 1.0, max_breakpoints)
    ys = clf.predict(xs)
    # Enforce the isotonic property on the downsampled curve (the uniform
    # sampling preserves monotonicity, but float error on the boundaries
    # can produce tiny non-monotone steps).
    ys = np.maximum.accumulate(ys)
    # Clip to [0,1] defensively.
    ys = np.clip(ys, 0.0, 1.0)
    return CalibrationCurve(xs=xs.tolist(), ys=ys.tolist())
