"""Backtest regression guardrail.

Runs between backtest() and export() in the nightly pipeline. Refuses to
publish JSON if the freshly-trained model regressed meaningfully vs the
rolling baseline of recent successful runs.

Rules:
- HARD FLOOR: fail if any tour accuracy < 0.68 or log_loss > 0.60.
- ROLLING: once ≥3 baseline samples exist, fail if accuracy < mean - 2σ.
- WARN: accuracy < mean - 1σ (stderr only).

Baseline is persisted to pipeline/.cache/guardrail_baseline.json as a
rolling window of the last N successful runs (one entry per run per tour).
"""

from __future__ import annotations

import json
import statistics
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .config import CACHE_DIR

BASELINE_FILE = CACHE_DIR / "guardrail_baseline.json"
ROLLING_WINDOW = 10

HARD_FLOOR_ACCURACY = 0.68
HARD_CEIL_LOG_LOSS = 0.60


@dataclass
class GuardrailResult:
    ok: bool
    warnings: list[str]
    failures: list[str]

    def report(self) -> str:
        lines = []
        for w in self.warnings:
            lines.append(f"⚠️  {w}")
        for f in self.failures:
            lines.append(f"❌ {f}")
        if self.ok and not self.warnings:
            lines.append("✅ guardrail passed")
        return "\n".join(lines)


def _load_baseline() -> dict[str, list[dict]]:
    if not BASELINE_FILE.exists():
        return {}
    try:
        return json.loads(BASELINE_FILE.read_text())
    except json.JSONDecodeError:
        return {}


def _save_baseline(baseline: dict[str, list[dict]]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    BASELINE_FILE.write_text(json.dumps(baseline, indent=2))


def check(metrics_by_tour: dict[str, object], persist: bool = True) -> GuardrailResult:
    """Run checks. `metrics_by_tour` maps tour → BacktestMetrics (or compatible).

    If `persist`, append the current metrics to the rolling baseline on success.
    Returns a GuardrailResult; caller decides whether to sys.exit.
    """
    baseline = _load_baseline()
    warnings: list[str] = []
    failures: list[str] = []

    for tour, m in metrics_by_tour.items():
        acc = float(getattr(m, "accuracy", m["accuracy"] if isinstance(m, dict) else 0.0))
        ll = float(getattr(m, "log_loss", m["logLoss"] if isinstance(m, dict) else 1.0))

        # Hard floor — always enforced.
        if acc < HARD_FLOOR_ACCURACY:
            failures.append(
                f"{tour}: accuracy {acc:.3f} < hard floor {HARD_FLOOR_ACCURACY:.2f}",
            )
        if ll > HARD_CEIL_LOG_LOSS:
            failures.append(
                f"{tour}: log_loss {ll:.3f} > hard ceiling {HARD_CEIL_LOG_LOSS:.2f}",
            )

        # Rolling baseline — needs ≥3 samples to trust.
        history = baseline.get(tour, [])
        accs = [h["accuracy"] for h in history]
        if len(accs) >= 3:
            mean = statistics.fmean(accs)
            std = statistics.pstdev(accs) or 1e-6
            if acc < mean - 2 * std:
                failures.append(
                    f"{tour}: accuracy {acc:.3f} < rolling μ-2σ "
                    f"({mean:.3f} - 2×{std:.3f} = {mean - 2 * std:.3f})",
                )
            elif acc < mean - std:
                warnings.append(
                    f"{tour}: accuracy {acc:.3f} < rolling μ-1σ ({mean - std:.3f})",
                )

    ok = not failures

    if ok and persist:
        now = datetime.now(timezone.utc).isoformat()
        for tour, m in metrics_by_tour.items():
            acc = float(getattr(m, "accuracy", m["accuracy"] if isinstance(m, dict) else 0.0))
            ll = float(getattr(m, "log_loss", m["logLoss"] if isinstance(m, dict) else 1.0))
            history = baseline.setdefault(tour, [])
            history.append({"at": now, "accuracy": acc, "logLoss": ll})
            baseline[tour] = history[-ROLLING_WINDOW:]
        _save_baseline(baseline)

    return GuardrailResult(ok=ok, warnings=warnings, failures=failures)


def enforce(metrics_by_tour: dict[str, object]) -> None:
    """Check and exit non-zero on failure."""
    result = check(metrics_by_tour)
    print(result.report(), file=sys.stderr if result.failures else sys.stdout)
    if not result.ok:
        sys.exit(1)


def reset_baseline() -> None:
    """For tests — wipe the on-disk baseline."""
    if BASELINE_FILE.exists():
        BASELINE_FILE.unlink()


if __name__ == "__main__":
    # Allow manual invocation: python -m tenisfranz.guardrail path/to/backtest.json
    if len(sys.argv) != 2:
        print("usage: python -m tenisfranz.guardrail <backtest.json>", file=sys.stderr)
        sys.exit(2)
    data = json.loads(Path(sys.argv[1]).read_text())
    enforce(data)
