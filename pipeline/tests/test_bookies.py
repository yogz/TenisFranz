"""Tests for bookies.py — de-juicing, edge, ROI."""

from __future__ import annotations

import math

import pytest

from tenisfranz import bookies


def test_shin_dejuice_sums_to_one():
    for (oa, ob) in [(1.5, 2.7), (1.8, 2.1), (1.01, 50.0), (2.0, 2.0)]:
        pa, pb = bookies.shin_dejuice(oa, ob)
        assert abs(pa + pb - 1.0) < 1e-9


def test_shin_dejuice_anti_symmetric():
    pa, pb = bookies.shin_dejuice(1.7, 2.3)
    pb2, pa2 = bookies.shin_dejuice(2.3, 1.7)
    assert abs(pa - pa2) < 1e-9
    assert abs(pb - pb2) < 1e-9


def test_shin_dejuice_favorite_has_higher_prob():
    pa, pb = bookies.shin_dejuice(1.3, 4.0)
    assert pa > pb
    assert pa > 0.7


def test_shin_vs_naive_bias():
    # Favorite-longshot bias: longshots are overbet, so naive normalization
    # understates favorites. Shin's correction raises the favorite's fair
    # probability above the naive value (and lowers the longshot's).
    oa, ob = 1.2, 5.5
    shin_a, _ = bookies.shin_dejuice(oa, ob)
    naive_a = (1 / oa) / (1 / oa + 1 / ob)
    assert shin_a > naive_a


def test_shin_rejects_invalid_odds():
    with pytest.raises(ValueError):
        bookies.shin_dejuice(0.9, 2.0)
    with pytest.raises(ValueError):
        bookies.shin_dejuice(1.5, 1.0)


def test_edge_pts_sign_and_round():
    assert bookies.edge_pts(0.60, 0.50) == 10
    assert bookies.edge_pts(0.50, 0.60) == -10
    assert bookies.edge_pts(0.555, 0.500) == 6  # round half to even: 5.5 → 6


def test_roi_flat_bet_simple():
    picks = [
        bookies.Pick(date="2020-01-01", model_prob=0.6, bookie_prob=0.5, odds=2.0, won=True),
        bookies.Pick(date="2020-01-02", model_prob=0.6, bookie_prob=0.5, odds=2.0, won=False),
        bookies.Pick(date="2020-01-03", model_prob=0.6, bookie_prob=0.5, odds=2.0, won=True),
    ]
    roi, curve = bookies.roi_flat_bet(picks, stake=1.0)
    # 2 wins × 1.0 profit, 1 loss × -1.0 → balance = 1.0; staked = 3.0 → ROI = 1/3
    assert math.isclose(roi, 1.0 / 3.0)
    assert len(curve) == 3
    assert curve[-1].balance == pytest.approx(1.0)
