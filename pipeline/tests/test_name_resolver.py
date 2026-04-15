"""Name resolver tests — strict tuple + fuzzy + collisions."""

from __future__ import annotations

import pandas as pd
import pytest

from tenisfranz import name_resolver as nr_module
from tenisfranz.name_resolver import NameResolver, normalize


@pytest.fixture(autouse=True)
def clear_overrides(monkeypatch):
    # Overrides are pinned to real Sackmann player_ids — wipe them for tests
    # that use synthetic fixture data.
    monkeypatch.setattr(nr_module, "OVERRIDES", {})


def test_normalize_strips_accents_and_case():
    assert normalize("Đoković") == "djokovic"
    assert normalize("Auger-Aliassime") == "auger aliassime"
    assert normalize("  García López  ") == "garcia lopez"


@pytest.fixture
def atp_df():
    return pd.DataFrame([
        {"player_id": 1, "name_first": "Novak", "name_last": "Djokovic", "dob": "19870522"},
        {"player_id": 2, "name_first": "Carlos", "name_last": "Alcaraz", "dob": "20030505"},
        {"player_id": 3, "name_first": "Alexander", "name_last": "Zverev", "dob": "19970420"},
        {"player_id": 4, "name_first": "Mischa", "name_last": "Zverev", "dob": "19870822"},
        {"player_id": 5, "name_first": "Casper", "name_last": "Ruud", "dob": "19981222"},
        {"player_id": 6, "name_first": "Christian", "name_last": "Ruud", "dob": "19720831"},
    ])


def test_exact_unique(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    assert r.resolve("Djokovic", first_init="N") == "1"
    assert r.resolve("Alcaraz", first_init="C") == "2"


def test_accent_folded(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    assert r.resolve("Đoković", first_init="N") == "1"


def test_collision_needs_disambiguation(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    # Ruud C. matches two players — one historical (Christian), one current (Casper).
    # Without birth year or full name, it's a miss.
    assert r.resolve("Ruud", first_init="C") is None
    # With full first name, it resolves.
    assert r.resolve("Ruud", first_full="Casper") == "5"
    # With birth year, also resolves.
    assert r.resolve("Ruud", first_init="C", birth_year=1998) == "5"


def test_zverev_brothers_need_initial(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    assert r.resolve("Zverev", first_init="A") == "3"
    assert r.resolve("Zverev", first_init="M") == "4"


def test_unknown_returns_none(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    assert r.resolve("Nobody", first_init="X") is None


def test_miss_ratio_tracks_failures(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    r.resolve("Djokovic", first_init="N")  # hit
    r.resolve("Nobody", first_init="X")  # miss
    assert r.miss_ratio() == pytest.approx(0.5)


def test_fuzzy_singleton_case_insensitive(atp_df):
    r = NameResolver.from_dataframe(atp_df, tour="atp")
    # Upper case + punctuation noise — goes through normalize not fuzzy, but
    # verifies the end-to-end path works.
    assert r.resolve("DJOKOVIC", first_init="N") == "1"
