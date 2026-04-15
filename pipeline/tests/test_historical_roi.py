"""Tests for historical_roi — simulation semantics with synthetic data."""

from __future__ import annotations

import json

import pandas as pd
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


# --- Walk-forward orchestration helpers ---------------------------------


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("Nadal R.", ("Nadal", "R")),
        ("Nadal R", ("Nadal", "R")),
        ("Del Potro J.M.", ("Del Potro", "J")),
        ("Auger Aliassime F.", ("Auger Aliassime", "F")),
        ("Federer R.", ("Federer", "R")),
        ("Lastnameonly", ("Lastnameonly", "")),
        ("", ("", "")),
        ("   ", ("", "")),
    ],
)
def test_parse_td_name(raw, expected):
    assert hr._parse_td_name(raw) == expected


def test_read_td_odds_canonicalizes_columns(tmp_path):
    # Build a minimal tennis-data.co.uk-shaped xlsx and confirm _read_td_odds
    # normalizes it, drops NaN-odds rows, and filters sub-1.0 odds.
    src = pd.DataFrame(
        {
            "Date": ["2020-01-15", "2020-01-16", "2020-01-17", "2020-01-18"],
            "Winner": ["Nadal R.", "Federer R.", "Djokovic N.", "Thiem D."],
            "Loser": ["Thiem D.", "Nadal R.", "Federer R.", "Djokovic N."],
            "Surface": ["Hard", "Hard", "Hard", "Hard"],
            "AvgW": [1.50, 2.10, 1.80, None],  # last dropped
            "AvgL": [2.60, 1.75, 2.05, 1.90],
        }
    )
    path = tmp_path / "atp_2020.xlsx"
    src.to_excel(path, index=False)

    out = hr._read_td_odds(path)
    assert list(out.columns) == ["Date", "Winner", "Loser", "Surface", "AvgW", "AvgL"]
    assert len(out) == 3  # NaN-odds row dropped
    assert out["Winner"].iloc[0] == "Nadal R."
    assert out["AvgW"].dtype.kind == "f"


def test_read_td_odds_falls_back_to_b365_when_avg_missing(tmp_path):
    # Older files don't have AvgW/AvgL — fallback chain should pick up B365.
    src = pd.DataFrame(
        {
            "Date": ["2006-06-05"],
            "Winner": ["Federer R."],
            "Loser": ["Nadal R."],
            "Surface": ["Grass"],
            "B365W": [1.45],
            "B365L": [2.80],
        }
    )
    path = tmp_path / "atp_2006.xlsx"
    src.to_excel(path, index=False)

    out = hr._read_td_odds(path)
    assert len(out) == 1
    assert out["AvgW"].iloc[0] == pytest.approx(1.45)
    assert out["AvgL"].iloc[0] == pytest.approx(2.80)


def test_read_td_odds_returns_empty_when_required_columns_missing(tmp_path):
    src = pd.DataFrame({"Date": ["2020-01-01"], "Winner": ["Foo"]})
    path = tmp_path / "broken.xlsx"
    src.to_excel(path, index=False)
    out = hr._read_td_odds(path)
    assert out.empty


def test_nearest_sack_row_picks_closest_within_tolerance():
    idx = {
        ("W1", "L1"): [
            (pd.Timestamp("2020-01-01"), 0),
            (pd.Timestamp("2020-01-20"), 1),
        ],
    }
    # td_date is 2020-01-22 → within 21 days of both, but index 1 is closer.
    assert hr._nearest_sack_row(idx, "W1", "L1", pd.Timestamp("2020-01-22")) == 1
    # td_date is 2020-05-01 → outside tolerance.
    assert hr._nearest_sack_row(idx, "W1", "L1", pd.Timestamp("2020-05-01")) is None
    # Missing pair → None.
    assert hr._nearest_sack_row(idx, "X", "Y", pd.Timestamp("2020-01-01")) is None


def test_build_sack_index_groups_by_pair():
    df = pd.DataFrame(
        {
            "winner_id": ["A", "A", "C"],
            "loser_id": ["B", "B", "D"],
            "tourney_date": pd.to_datetime(["2020-01-01", "2021-06-10", "2019-03-15"]),
        }
    )
    idx = hr._build_sack_index(df)
    assert len(idx[("A", "B")]) == 2
    assert len(idx[("C", "D")]) == 1
    # Row indices are preserved (0, 1, 2).
    assert {i for _, i in idx[("A", "B")]} == {0, 1}
