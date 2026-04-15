"""Guardrail regression tests."""

from __future__ import annotations

import json
from dataclasses import dataclass

import pytest

from tenisfranz import guardrail


@dataclass
class FakeMetrics:
    accuracy: float
    log_loss: float


@pytest.fixture(autouse=True)
def isolate_baseline(tmp_path, monkeypatch):
    # Redirect the baseline file to a temp path so tests don't pollute the real cache.
    fake = tmp_path / "baseline.json"
    monkeypatch.setattr(guardrail, "BASELINE_FILE", fake)
    yield


def test_pass_clean_run():
    result = guardrail.check(
        {"atp": FakeMetrics(0.73, 0.54), "wta": FakeMetrics(0.74, 0.53)},
    )
    assert result.ok
    assert not result.failures
    assert not result.warnings


def test_hard_floor_fails():
    result = guardrail.check(
        {"atp": FakeMetrics(0.55, 0.54), "wta": FakeMetrics(0.74, 0.53)},
        persist=False,
    )
    assert not result.ok
    assert any("hard floor" in f for f in result.failures)


def test_hard_ceil_log_loss():
    result = guardrail.check(
        {"atp": FakeMetrics(0.73, 0.85), "wta": FakeMetrics(0.74, 0.53)},
        persist=False,
    )
    assert not result.ok
    assert any("log_loss" in f for f in result.failures)


def test_rolling_fail_after_history():
    for _ in range(4):
        guardrail.check({"atp": FakeMetrics(0.73, 0.54)})
    # Big drop — should fail rolling check
    result = guardrail.check({"atp": FakeMetrics(0.69, 0.54)}, persist=False)
    assert not result.ok
    assert any("rolling" in f for f in result.failures)


def test_rolling_warn_between_one_and_two_sigma():
    # Wider variance so 1σ gap is meaningful
    for acc in (0.720, 0.735, 0.745, 0.740):
        guardrail.check({"atp": FakeMetrics(acc, 0.54)})
    # Slight dip — should trigger warn but not fail
    result = guardrail.check({"atp": FakeMetrics(0.725, 0.54)}, persist=False)
    assert result.ok
    assert any("rolling" in w for w in result.warnings)


def test_baseline_bounded_rolling_window():
    for i in range(20):
        guardrail.check({"atp": FakeMetrics(0.73 + i * 0.0001, 0.54)})
    data = json.loads(guardrail.BASELINE_FILE.read_text())
    assert len(data["atp"]) == guardrail.ROLLING_WINDOW


def test_failed_run_does_not_persist():
    # Pass once to seed the baseline
    guardrail.check({"atp": FakeMetrics(0.73, 0.54)})
    before = json.loads(guardrail.BASELINE_FILE.read_text())
    # Now a failing run — should not append
    guardrail.check({"atp": FakeMetrics(0.50, 0.54)})
    after = json.loads(guardrail.BASELINE_FILE.read_text())
    assert len(before["atp"]) == len(after["atp"])
