"""Elo sanity: symmetric, converges on a lopsided matchup, pre-match values used."""

from __future__ import annotations

import pandas as pd

from tenisfranz.features import elo_surface


def _match(date: str, winner: str, loser: str, surface: str = "Hard") -> dict:
    return {
        "tourney_date": pd.Timestamp(date),
        "surface": surface,
        "winner_id": winner,
        "loser_id": loser,
    }


def test_first_match_is_cold_start():
    df = pd.DataFrame([_match("2020-01-01", "a", "b")])
    out, state = elo_surface.compute(df)
    # pre-match values must equal cold-start
    assert out.loc[0, "w_elo_surface"] == 1500.0
    assert out.loc[0, "l_elo_surface"] == 1500.0
    # after update, winner > loser
    assert state.get("Hard", "a") > state.get("Hard", "b")


def test_dominant_player_climbs():
    rows = [_match(f"2020-01-{i+1:02d}", "pro", "rookie") for i in range(20)]
    df = pd.DataFrame(rows)
    _, state = elo_surface.compute(df)
    assert state.get("Hard", "pro") > 1600
    assert state.get("Hard", "rookie") < 1400


def test_surfaces_are_independent():
    rows = [
        _match("2020-01-01", "a", "b", "Clay"),
        _match("2020-01-02", "a", "b", "Clay"),
        _match("2020-01-03", "b", "a", "Grass"),
    ]
    df = pd.DataFrame(rows)
    _, state = elo_surface.compute(df)
    assert state.get("Clay", "a") > state.get("Clay", "b")
    assert state.get("Grass", "b") > state.get("Grass", "a")
    assert state.get("Hard", "a") == 1500.0
