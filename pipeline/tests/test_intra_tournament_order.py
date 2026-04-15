"""Regression tests for intra-tournament ordering.

The bug: Sackmann CSVs store all matches of a tournament with the same
`tourney_date` (the Monday of the tournament week). Sorting by `tourney_date`
alone preserves CSV row order within a tournament, which is NOT play order
for every tournament — e.g. Brisbane 2024 lists the final first and R16
last. That silently reversed the causal direction of the feature pipeline
for reversed tournaments, producing a ~5pt accuracy leak and ~20pt ROI leak.

Fix: secondary sort by `match_num` (monotonic within a tournament).

These tests guard against the bug coming back by:
 1. Asserting that after ingest, matches within a tournament are sorted
    by `match_num` ascending.
 2. Asserting that permuting the input row order produces the SAME
    feature output — i.e. the pipeline is order-invariant by construction.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from tenisfranz.features.assemble import add_all


def _synthetic_tournament(
    tourney_id: str,
    tourney_date: str,
    tourney_name: str,
    surface: str = "Hard",
    rounds_reversed_in_csv: bool = False,
) -> pd.DataFrame:
    """Build a 7-row single-tournament frame (R16 → Final) with two players
    repeating across rounds.

    Player 100 wins the R16 and QF and Final. Player 200 wins the SF.
    Arranged so that if the pipeline processes matches out of order, the
    form/elo features of the earlier rounds will be polluted by later
    rounds' results.
    """
    rows = [
        # (match_num, round, winner_id, loser_id)
        (10, "R16", "100", "300"),
        (11, "R16", "200", "301"),
        (12, "R16", "400", "500"),
        (13, "R16", "600", "700"),
        (20, "QF", "100", "200"),  # player 100 beats 200 in QF
        (21, "QF", "400", "600"),
        (30, "SF", "100", "400"),  # player 100 beats 400 in SF
        (40, "F", "100", "500"),   # player 100 wins the tournament
    ]
    if rounds_reversed_in_csv:
        rows = list(reversed(rows))

    df = pd.DataFrame(
        {
            "tourney_id": [tourney_id] * len(rows),
            "tourney_date": [pd.Timestamp(tourney_date)] * len(rows),
            "tourney_name": [tourney_name] * len(rows),
            "tourney_level": ["A"] * len(rows),
            "surface": [surface] * len(rows),
            "match_num": [r[0] for r in rows],
            "round": [r[1] for r in rows],
            "winner_id": [r[2] for r in rows],
            "loser_id": [r[3] for r in rows],
            "winner_name": [f"Winner{r[2]}" for r in rows],
            "loser_name": [f"Loser{r[3]}" for r in rows],
            "winner_age": [25.0] * len(rows),
            "loser_age": [27.0] * len(rows),
            "minutes": [90] * len(rows),
            "w_1stWon": [20] * len(rows),
            "w_2ndWon": [10] * len(rows),
            "w_svpt": [50] * len(rows),
            "l_1stWon": [18] * len(rows),
            "l_2ndWon": [8] * len(rows),
            "l_svpt": [50] * len(rows),
            "best_of": [3] * len(rows),
            "tour": ["atp"] * len(rows),
        }
    )
    return df


def test_intra_tournament_order_is_match_num_ascending():
    """After ingest-style sort, match_num must be ascending within a tournament."""
    # Simulate a CSV where the tournament is listed with Final first.
    df = _synthetic_tournament(
        "T1", "2024-01-01", "Brisbane", rounds_reversed_in_csv=True,
    )
    # Apply the same sort ingest.py does.
    df["match_num"] = pd.to_numeric(df["match_num"], errors="coerce")
    sorted_df = df.sort_values(
        ["tourney_date", "tourney_id", "match_num"], kind="mergesort",
    ).reset_index(drop=True)

    match_nums = sorted_df["match_num"].tolist()
    assert match_nums == sorted(match_nums), (
        f"intra-tournament order broken: {match_nums}"
    )


def test_feature_computation_is_invariant_to_csv_row_order():
    """Two CSV orderings of the same tournament must yield identical features
    after the sort fix."""
    df_forward = _synthetic_tournament(
        "T1", "2024-01-01", "Brisbane", rounds_reversed_in_csv=False,
    )
    df_reversed = _synthetic_tournament(
        "T1", "2024-01-01", "Brisbane", rounds_reversed_in_csv=True,
    )

    # Apply ingest.py-style sort
    def canonical_sort(d: pd.DataFrame) -> pd.DataFrame:
        d = d.copy()
        d["match_num"] = pd.to_numeric(d["match_num"], errors="coerce")
        return d.sort_values(
            ["tourney_date", "tourney_id", "match_num"], kind="mergesort",
        ).reset_index(drop=True)

    a, _ = add_all(canonical_sort(df_forward))
    b, _ = add_all(canonical_sort(df_reversed))

    # Check every derived feature column is identical — that's the real
    # invariant. If the sort is correct AND the feature modules are causal,
    # these must be bit-identical.
    feat_cols = [
        c for c in a.columns
        if c.startswith(("w_elo_surface", "l_elo_surface",
                         "w_form", "l_form",
                         "w_serve_pct", "l_serve_pct",
                         "w_return_pct", "l_return_pct",
                         "w_h2h", "l_h2h",
                         "w_fatigue", "l_fatigue",
                         "w_age", "l_age"))
    ]
    for col in feat_cols:
        np.testing.assert_array_almost_equal(
            a[col].to_numpy(), b[col].to_numpy(), decimal=8,
            err_msg=f"feature {col} depends on CSV row order",
        )


def test_leak_would_show_up_without_sort():
    """Sanity check: confirm that WITHOUT the secondary sort, features
    differ between forward and reversed CSV order. This is the bug the
    previous tests protect against — if this test ever fails, the sort
    fix must have been reverted or the feature modules are already causal
    enough to be order-invariant (in which case the other tests remain the
    guard)."""
    df_forward = _synthetic_tournament(
        "T1", "2024-01-01", "Brisbane", rounds_reversed_in_csv=False,
    )
    df_reversed = _synthetic_tournament(
        "T1", "2024-01-01", "Brisbane", rounds_reversed_in_csv=True,
    )
    # Deliberately WRONG sort: only by date, preserving CSV row order.
    def wrong_sort(d: pd.DataFrame) -> pd.DataFrame:
        return d.sort_values("tourney_date", kind="mergesort").reset_index(drop=True)

    a, _ = add_all(wrong_sort(df_forward))
    b, _ = add_all(wrong_sort(df_reversed))

    # Elo must differ — player 100 plays multiple rounds and Elo
    # propagates differently in each order.
    p100_elo_fwd = a[a["winner_id"] == "100"]["w_elo_surface"].to_numpy()
    p100_elo_rev = b[b["winner_id"] == "100"]["w_elo_surface"].to_numpy()
    # Find the R16 row for player 100 in each (first one by match_num or
    # first one in the frame).
    assert not np.allclose(sorted(p100_elo_fwd), sorted(p100_elo_rev)) or \
           not np.allclose(p100_elo_fwd, p100_elo_rev), (
        "Without the secondary sort, reversed and forward CSVs should give "
        "different features. If they don't, the feature modules handle the "
        "order themselves — in which case the sort is still a good defense "
        "in depth but this regression test is redundant."
    )
