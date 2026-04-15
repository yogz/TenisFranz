"""Bookmaker odds helpers.

Shin's de-juicing method removes favorite-longshot bias that naive
normalization leaves in. We use it from day one because the whole point
of "model vs bookies" is measuring small edges, and naive de-juicing
would produce systematic fake edge on dogs and fake anti-edge on favorites.

Reference: Shin (1993) "Measuring the incidence of insider trading in a
market for state-contingent claims". The closed-form for 2-outcome markets:

  z = (sum(π) - 1) / (N - 1)
  p_i = (sqrt(z² + 4(1 - z) * π_i² / sum(π)) - z) / (2 * (1 - z))

where π_i = 1 / odds_i is the raw implied probability and N = number of
outcomes. For 2-outcome (tennis head-to-head) N = 2.
"""

from __future__ import annotations

import math
from dataclasses import dataclass


def _raw_implied(odds_a: float, odds_b: float) -> tuple[float, float, float]:
    pi_a = 1.0 / odds_a
    pi_b = 1.0 / odds_b
    return pi_a, pi_b, pi_a + pi_b


def _shin_p(pi: float, total: float, z: float) -> float:
    """Shin's per-outcome fair probability given overround total and insider z."""
    disc = z * z + 4.0 * (1.0 - z) * pi * pi / total
    return (math.sqrt(disc) - z) / (2.0 * (1.0 - z))


def _shin_z(pis: list[float]) -> float:
    """Bisect z ∈ [0, 1) such that Σ shin_p(pi_i, total, z) = 1."""
    total = sum(pis)
    if total <= 1.0:
        return 0.0
    lo, hi = 0.0, 0.999999
    for _ in range(80):
        mid = (lo + hi) / 2.0
        s = sum(_shin_p(p, total, mid) for p in pis)
        if s > 1.0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def shin_dejuice(odds_a: float, odds_b: float) -> tuple[float, float]:
    """Return fair probabilities (pA, pB) with pA + pB == 1."""
    if odds_a <= 1.0 or odds_b <= 1.0:
        raise ValueError(f"invalid decimal odds: {odds_a=}, {odds_b=}")
    pi_a, pi_b, total = _raw_implied(odds_a, odds_b)
    if total <= 1.0:
        # Negative overround — Shin's assumption (insider probability ≥ 0)
        # breaks down. Fall back to straight normalization.
        return pi_a / total, pi_b / total

    z = _shin_z([pi_a, pi_b])
    p_a = _shin_p(pi_a, total, z)
    p_b = _shin_p(pi_b, total, z)
    # Renormalize residual float drift.
    s = p_a + p_b
    return p_a / s, p_b / s


def edge_pts(model_prob: float, bookie_prob: float) -> int:
    """Signed percentage-point edge, rounded."""
    return round((model_prob - bookie_prob) * 100)


@dataclass
class Pick:
    """A historical pick made by the model against bookmaker prices."""

    date: str  # ISO yyyy-mm-dd
    model_prob: float
    bookie_prob: float
    odds: float  # decimal odds on the model's pick
    won: bool

    @property
    def edge(self) -> float:
        return self.model_prob - self.bookie_prob


@dataclass
class BankrollPoint:
    date: str
    balance: float
    picks: int


def roi_flat_bet(picks: list[Pick], stake: float = 1.0) -> tuple[float, list[BankrollPoint]]:
    """Simulate flat-stake betting. Returns (final ROI, bankroll curve).

    ROI is (final_balance - total_staked) / total_staked.
    """
    balance = 0.0
    total_staked = 0.0
    curve: list[BankrollPoint] = []
    # Sort by date so the curve is monotonic in time.
    ordered = sorted(picks, key=lambda p: p.date)
    for i, pick in enumerate(ordered, start=1):
        total_staked += stake
        if pick.won:
            balance += (pick.odds - 1.0) * stake
        else:
            balance -= stake
        curve.append(BankrollPoint(date=pick.date, balance=balance, picks=i))
    roi = balance / total_staked if total_staked > 0 else 0.0
    return roi, curve
