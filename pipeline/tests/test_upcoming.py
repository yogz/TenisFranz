"""End-to-end tests for upcoming.py — uses real committed model.json."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from tenisfranz import upcoming
from tenisfranz.config import DATA_OUT_DIR
from tenisfranz.draws_fetcher import DrawMatch

FIXTURE_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def fresh_now():
    """A datetime close to the committed model's trainedAt."""
    meta = upcoming.load_meta()
    trained = datetime.fromisoformat(meta["trainedAt"].replace("Z", "+00:00"))
    return trained + timedelta(hours=1)


def test_check_model_freshness_pass(fresh_now):
    meta = upcoming.load_meta()
    upcoming.check_model_freshness(meta, fresh_now)


def test_check_model_freshness_fails_when_stale():
    meta = upcoming.load_meta()
    trained = datetime.fromisoformat(meta["trainedAt"].replace("Z", "+00:00"))
    far_future = trained + timedelta(days=30)
    with pytest.raises(RuntimeError, match="stale"):
        upcoming.check_model_freshness(meta, far_future)


def test_check_model_freshness_missing_field():
    with pytest.raises(RuntimeError, match="trainedAt"):
        upcoming.check_model_freshness({}, datetime.now(timezone.utc))


def test_build_upcoming_payload_happy_path(fresh_now):
    bundle = upcoming.load_model_bundle()
    meta = upcoming.load_meta()
    elo = upcoming.load_elo()
    players = upcoming.load_players()

    # Build draws from real players that definitely exist in players.json.
    # Use slugs we can see in the committed data.
    atp_players = [p for p in players if p.get("tour") == "atp"]
    # Pick two well-known players who exist.
    by_last = {p["lastName"]: p for p in atp_players}
    # Fall back to whichever pair is present in the fixture — we need 2.
    candidates = [("Sinner", "Alcaraz"), ("Djokovic", "Alcaraz"), ("Sinner", "Djokovic")]
    pair = next(((a, b) for a, b in candidates if a in by_last and b in by_last), None)
    assert pair is not None, "expected 2 well-known ATP players in fixture"
    a_last, b_last = pair

    draws = [
        DrawMatch(
            tour="atp",
            date="2026-04-18",
            tournament="Monte Carlo Masters",
            round="SF",
            surface="Clay",
            player_a_last=a_last,
            player_a_first=by_last[a_last]["firstName"],
            player_b_last=b_last,
            player_b_first=by_last[b_last]["firstName"],
            tourney_level="M",
        ),
    ]

    payload = upcoming.build_upcoming_payload(
        draws, bundle, meta, elo, players, fresh_now,
    )
    assert payload["modelTrainedAt"] == meta["trainedAt"]
    assert len(payload["matches"]) == 1
    m = payload["matches"][0]
    assert 0.0 <= m["modelProbA"] <= 1.0
    assert m["tour"] == "atp"
    assert m["surface"] == "Clay"
    assert m["round"] == "SF"
    assert "playerA" in m and "playerB" in m


def test_build_upcoming_payload_unresolved_name_skipped(fresh_now):
    bundle = upcoming.load_model_bundle()
    meta = upcoming.load_meta()
    elo = upcoming.load_elo()
    players = upcoming.load_players()

    draws = [
        DrawMatch(
            tour="atp",
            date="2026-04-18",
            tournament="Fake Open",
            round="F",
            surface="Hard",
            player_a_last="Nonexistentplayer",
            player_a_first="Ghost",
            player_b_last="Anotherone",
            player_b_first="Noone",
            tourney_level="A",
        ),
    ]
    # Miss ratio will be 100% → raises.
    with pytest.raises(RuntimeError, match="miss ratio"):
        upcoming.build_upcoming_payload(draws, bundle, meta, elo, players, fresh_now)


def test_build_upcoming_payload_empty_draws(fresh_now):
    bundle = upcoming.load_model_bundle()
    meta = upcoming.load_meta()
    elo = upcoming.load_elo()
    players = upcoming.load_players()
    payload = upcoming.build_upcoming_payload([], bundle, meta, elo, players, fresh_now)
    assert payload["matches"] == []
    assert payload["stats"]["fetched"] == 0


def test_write_upcoming_roundtrip(tmp_path, fresh_now):
    payload = {
        "updatedAt": fresh_now.isoformat(),
        "modelTrainedAt": fresh_now.isoformat(),
        "source": "test",
        "matches": [],
        "stats": {"fetched": 0, "resolved": 0, "missRatio": 0.0},
    }
    out = upcoming.write_upcoming(payload, data_dir=tmp_path)
    assert out.exists()
    loaded = json.loads(out.read_text())
    assert loaded == payload
