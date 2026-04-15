"""Tests for the isotonic calibration module."""

from __future__ import annotations

import json
import math
import random

import pytest

from tenisfranz import calibration


def test_identity_apply_is_noop():
    curve = calibration.CalibrationCurve.identity()
    for p in (0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0):
        assert curve.apply(p) == pytest.approx(p, abs=1e-9)


def test_apply_interpolates_linearly_between_breakpoints():
    curve = calibration.CalibrationCurve(xs=[0.0, 0.5, 1.0], ys=[0.0, 0.6, 1.0])
    # Breakpoint exactness
    assert curve.apply(0.0) == pytest.approx(0.0)
    assert curve.apply(0.5) == pytest.approx(0.6)
    assert curve.apply(1.0) == pytest.approx(1.0)
    # Mid-segment interpolation
    assert curve.apply(0.25) == pytest.approx(0.3)  # halfway to 0.6
    assert curve.apply(0.75) == pytest.approx(0.8)  # halfway from 0.6 to 1.0


def test_apply_clamps_out_of_range():
    curve = calibration.CalibrationCurve(xs=[0.1, 0.9], ys=[0.15, 0.92])
    assert curve.apply(-0.5) == pytest.approx(0.15)  # below xs[0]
    assert curve.apply(1.5) == pytest.approx(0.92)   # above xs[-1]


def test_fit_identity_for_too_few_samples():
    curve = calibration.fit([0.5] * 10, [1, 0, 1, 0, 1, 0, 1, 0, 1, 0])
    assert curve.xs == [0.0, 1.0]
    assert curve.ys == [0.0, 1.0]


def test_fit_recovers_underconfidence():
    """Generate a synthetic "underconfident" model: predicted 0.7 but wins
    80% of the time. The fitted curve should map 0.7 → ~0.8."""
    rng = random.Random(42)
    probs = []
    labels = []
    for _ in range(4000):
        # True prob is 0.80 at all prediction points; model outputs 0.70.
        probs.append(0.70)
        labels.append(1 if rng.random() < 0.80 else 0)
        # Sprinkle other points so the curve has support across [0,1].
        probs.append(0.30)
        labels.append(1 if rng.random() < 0.20 else 0)
    curve = calibration.fit(probs, labels)
    cal_70 = curve.apply(0.70)
    cal_30 = curve.apply(0.30)
    assert 0.70 < cal_70 < 0.90, f"expected ~0.80, got {cal_70}"
    assert 0.10 < cal_30 < 0.30, f"expected ~0.20, got {cal_30}"


def test_fit_monotone():
    """The fitted curve must be non-decreasing in probability."""
    rng = random.Random(7)
    probs = [rng.random() for _ in range(2000)]
    # Ground truth: labels are correlated with probs (well-calibrated enough)
    labels = [1 if rng.random() < p else 0 for p in probs]
    curve = calibration.fit(probs, labels)
    ys = curve.ys
    for i in range(1, len(ys)):
        assert ys[i] >= ys[i - 1] - 1e-9, f"non-monotone at {i}: {ys[i-1]} > {ys[i]}"


def test_fit_outputs_bounded_01():
    rng = random.Random(3)
    probs = [rng.random() for _ in range(1500)]
    labels = [1 if rng.random() < p else 0 for p in probs]
    curve = calibration.fit(probs, labels)
    for y in curve.ys:
        assert 0.0 <= y <= 1.0


def test_roundtrip_json():
    curve = calibration.CalibrationCurve(xs=[0.0, 0.4, 1.0], ys=[0.0, 0.35, 1.0])
    blob = json.dumps(curve.to_dict())
    recovered = calibration.CalibrationCurve.from_dict(json.loads(blob))
    assert recovered.xs == curve.xs
    assert recovered.ys == curve.ys
    assert recovered.apply(0.4) == curve.apply(0.4)


def test_breakpoint_count_capped():
    """Large fit must still serialize to ≤ MAX_BREAKPOINTS."""
    rng = random.Random(11)
    probs = [rng.random() for _ in range(5000)]
    labels = [1 if rng.random() < p else 0 for p in probs]
    curve = calibration.fit(probs, labels, max_breakpoints=25)
    assert len(curve.xs) <= 25
    assert len(curve.ys) <= 25
    assert len(curve.xs) == len(curve.ys)
