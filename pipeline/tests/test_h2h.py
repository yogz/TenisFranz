"""Tests for h2h aggregates."""

from __future__ import annotations

import pandas as pd
import pytest

from tenisfranz import h2h


def _frame(rows):
    return pd.DataFrame(rows, columns=["winner_id", "loser_id", "surface"])


def test_empty_returns_empty():
    out = h2h.compute_h2h({"atp": _frame([])})
    assert out == {}


def test_symmetric_pairing():
    df = _frame([
        ("1", "2", "Hard"),
        ("2", "1", "Clay"),
        ("1", "2", "Clay"),
    ])
    out = h2h.compute_h2h({"atp": df})
    assert set(out.keys()) == {"atp-1", "atp-2"}
    one = out["atp-1"][0]
    two = out["atp-2"][0]
    assert one["opponent"] == "atp-2"
    assert two["opponent"] == "atp-1"
    # Player 1 won twice, lost once
    assert one["wins"] == 2
    assert one["losses"] == 1
    # Player 2 inverse
    assert two["wins"] == 1
    assert two["losses"] == 2


def test_min_matches_filters_singletons():
    df = _frame([
        ("1", "2", "Hard"),  # only 1 match between them — below MIN_MATCHES
        ("1", "3", "Hard"),
        ("1", "3", "Clay"),
    ])
    out = h2h.compute_h2h({"atp": df})
    # player 1 should only see opponent 3, not 2
    opponents_of_1 = [o["opponent"] for o in out.get("atp-1", [])]
    assert "atp-3" in opponents_of_1
    assert "atp-2" not in opponents_of_1


def test_best_surface_is_most_played():
    df = _frame([
        ("1", "2", "Hard"),
        ("2", "1", "Clay"),
        ("1", "2", "Clay"),
        ("2", "1", "Clay"),
    ])
    out = h2h.compute_h2h({"atp": df})
    assert out["atp-1"][0]["bestSurface"] == "Clay"


def test_top_n_cap():
    # Player 1 vs 10 opponents, all with 2 matches.
    rows = []
    for opp in range(2, 12):
        rows.append(("1", str(opp), "Hard"))
        rows.append((str(opp), "1", "Hard"))
    out = h2h.compute_h2h({"atp": _frame(rows)})
    assert len(out["atp-1"]) == h2h.TOP_N


def test_sorted_by_matches_played():
    rows = [
        # Player 1 vs 2: 3 matches
        ("1", "2", "Hard"), ("2", "1", "Hard"), ("1", "2", "Hard"),
        # Player 1 vs 3: 5 matches
        ("1", "3", "Hard"), ("1", "3", "Hard"), ("1", "3", "Hard"),
        ("3", "1", "Hard"), ("3", "1", "Hard"),
    ]
    out = h2h.compute_h2h({"atp": _frame(rows)})
    opponents = out["atp-1"]
    # First entry should be opponent 3 (5 matches), then 2 (3 matches).
    assert opponents[0]["opponent"] == "atp-3"
    assert opponents[1]["opponent"] == "atp-2"


def test_multi_tour_isolation():
    atp = _frame([
        ("1", "2", "Hard"),
        ("1", "2", "Hard"),
    ])
    wta = _frame([
        ("1", "2", "Clay"),
        ("1", "2", "Clay"),
    ])
    out = h2h.compute_h2h({"atp": atp, "wta": wta})
    # IDs are namespaced by tour so "1" in ATP and "1" in WTA don't collide.
    assert "atp-1" in out
    assert "wta-1" in out
    # atp-1 should only see atp-2 as an opponent, never wta-2.
    atp_opps = [o["opponent"] for o in out["atp-1"]]
    assert all(o.startswith("atp-") for o in atp_opps)
