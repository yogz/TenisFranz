"""Tests for draws_fetcher — file-backed loader and parse robustness."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from tenisfranz import draws_fetcher as df

FIXTURE_DIR = Path(__file__).parent / "fixtures"


def test_empty_loader_returns_empty_list(monkeypatch):
    monkeypatch.delenv("TENISFRANZ_DRAWS_ATP", raising=False)
    monkeypatch.delenv("TENISFRANZ_DRAWS_WTA", raising=False)
    assert df.fetch_atp() == []
    assert df.fetch_wta() == []


def test_file_loader_reads_fixture(monkeypatch):
    monkeypatch.setenv("TENISFRANZ_DRAWS_ATP", str(FIXTURE_DIR / "atp_draws_sample.json"))
    matches = df.fetch_atp()
    assert len(matches) == 2
    assert matches[0].tournament == "Monte Carlo Masters"
    assert matches[0].player_a_last == "Alcaraz"
    assert matches[0].round == "SF"
    assert matches[0].tourney_level == "M"


def test_file_loader_missing_file_returns_empty(monkeypatch, tmp_path):
    monkeypatch.setenv("TENISFRANZ_DRAWS_ATP", str(tmp_path / "nope.json"))
    assert df.fetch_atp() == []


def test_file_loader_malformed_json_returns_empty(monkeypatch, tmp_path):
    p = tmp_path / "bad.json"
    p.write_text("not json {{{")
    monkeypatch.setenv("TENISFRANZ_DRAWS_ATP", str(p))
    assert df.fetch_atp() == []


def test_parse_skips_bad_rows(monkeypatch, tmp_path):
    p = tmp_path / "mixed.json"
    p.write_text(json.dumps([
        {
            "tour": "atp",
            "date": "2026-04-18",
            "tournament": "T",
            "round": "F",
            "surface": "Clay",
            "player_a_last": "A",
            "player_b_last": "B",
        },
        {"missing": "fields"},
        "not a dict",
    ]))
    monkeypatch.setenv("TENISFRANZ_DRAWS_ATP", str(p))
    matches = df.fetch_atp()
    assert len(matches) == 1
    assert matches[0].player_a_last == "A"


def test_parse_non_list_returns_empty(monkeypatch, tmp_path):
    p = tmp_path / "dict.json"
    p.write_text('{"matches": []}')
    monkeypatch.setenv("TENISFRANZ_DRAWS_ATP", str(p))
    assert df.fetch_atp() == []


def test_fetch_all_merges_both_tours(monkeypatch):
    monkeypatch.setenv("TENISFRANZ_DRAWS_ATP", str(FIXTURE_DIR / "atp_draws_sample.json"))
    monkeypatch.setenv("TENISFRANZ_DRAWS_WTA", str(FIXTURE_DIR / "wta_draws_sample.json"))
    merged = df.fetch_all()
    assert len(merged) == 3
    assert {m.tour for m in merged} == {"atp", "wta"}
