"""Tests for historical_roi — simulation semantics with synthetic data."""

from __future__ import annotations

import json

import pytest

from tenisfranz import historical_roi as hr


def _m(date, pa, oa, ob, winner):
    return {
        "date": date,
        "model_prob_a": pa,
        "odds_a": oa,
        "odds_b": ob,
        "winner": winner,
    }


def test_simulate_empty_returns_zero():
    bundle = hr.simulate([])
    assert bundle.picks_count == 0
    assert bundle.roi == 0.0
    assert bundle.bankroll_curve == []


def test_simulate_winning_edge_pick_positive_roi():
    # Model says 70% on A, bookies imply ~50% → clear edge, A wins.
    matches = [_m("2020-01-01", 0.70, 2.0, 2.0, "A")]
    bundle = hr.simulate(matches, edge_threshold=0.03)
    assert bundle.picks_count == 1
    # Flat 1u at odds 2.0 that wins → +1.0 profit, staked 1.0 → ROI = 1.0
    assert bundle.roi == pytest.approx(1.0)
    assert len(bundle.bankroll_curve) == 1
    assert bundle.bankroll_curve[0].balance == pytest.approx(1.0)


def test_simulate_below_threshold_no_edge_pick():
    # Tiny edge, below 3pts threshold → no edge pick recorded.
    matches = [_m("2020-01-01", 0.52, 2.0, 2.0, "A")]
    bundle = hr.simulate(matches, edge_threshold=0.03)
    assert bundle.picks_count == 0
    assert bundle.roi == 0.0


def test_simulate_losing_pick_negative_balance():
    matches = [_m("2020-01-01", 0.70, 2.0, 2.0, "B")]
    bundle = hr.simulate(matches, edge_threshold=0.03)
    assert bundle.picks_count == 1
    assert bundle.roi == pytest.approx(-1.0)


def test_simulate_bankroll_curve_monotonic_time():
    matches = [
        _m("2020-03-15", 0.70, 2.0, 2.0, "A"),  # win +1
        _m("2020-01-01", 0.70, 2.0, 2.0, "A"),  # out of order in input
        _m("2020-02-01", 0.70, 2.0, 2.0, "B"),  # loss
    ]
    bundle = hr.simulate(matches, edge_threshold=0.03)
    assert bundle.picks_count == 3
    dates = [p.date for p in bundle.bankroll_curve]
    assert dates == sorted(dates)


def test_simulate_baselines_present():
    matches = [
        _m("2020-01-01", 0.70, 1.5, 2.7, "A"),
        _m("2020-01-02", 0.60, 2.1, 1.8, "A"),
    ]
    bundle = hr.simulate(matches)
    # All three baselines must be finite floats.
    assert isinstance(bundle.baselines.favorite_always, float)
    assert isinstance(bundle.baselines.model_always, float)
    assert isinstance(bundle.baselines.random, float)


def test_simulate_skips_malformed():
    matches = [
        _m("2020-01-01", 0.70, 2.0, 2.0, "A"),
        {"bad": "row"},
        _m("2020-01-02", 0.70, 2.0, 2.0, "B"),
    ]
    bundle = hr.simulate(matches, edge_threshold=0.03)
    assert bundle.picks_count == 2  # two good rows, bad one skipped


def test_simulate_skips_invalid_odds():
    matches = [
        _m("2020-01-01", 0.70, 0.5, 2.0, "A"),  # invalid odds_a
        _m("2020-01-02", 0.70, 2.0, 2.0, "A"),  # valid
    ]
    bundle = hr.simulate(matches, edge_threshold=0.03)
    assert bundle.picks_count == 1


def test_to_dict_schema(tmp_path):
    matches = [_m("2020-01-01", 0.70, 2.0, 2.0, "A")]
    bundle = hr.simulate(matches)
    d = bundle.to_dict()
    assert {"methodology", "source", "picksCount", "roi", "bankrollCurve", "baselines"} <= set(d)
    assert {"favoriteAlways", "modelAlways", "random"} <= set(d["baselines"])
    out = hr.write_bundle(bundle, data_dir=tmp_path)
    assert out.exists()
    loaded = json.loads(out.read_text())
    assert loaded["picksCount"] == 1


def test_empty_bundle_is_write_safe(tmp_path):
    bundle = hr.empty_bundle()
    out = hr.write_bundle(bundle, data_dir=tmp_path)
    loaded = json.loads(out.read_text())
    assert loaded["picksCount"] == 0
    assert loaded["source"] == "seed"
