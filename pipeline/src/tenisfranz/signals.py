"""Contextual signals that enrich matches_upcoming.json.

Three signals, all derived from free data sources without scraping:

1. **Odds movement**: compare today's odds to the previous snapshot.
   A swing >15% in implied probability = "someone knows something".
2. **Withdrawals**: matches present in the previous snapshot but absent
   today = a player withdrew or the match was cancelled.
3. **Weather**: OpenMeteo free API (no key needed), keyed by tournament
   → GPS coordinates. Flags extreme heat (>33°C) or strong wind (>30 km/h).

Usage: called from upcoming.py AFTER the odds fetch, enriching each match
dict with a `signals` list of short alert strings the UI can render.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from .config import DATA_OUT_DIR

logger = logging.getLogger(__name__)

PREV_SNAPSHOT_PATH = DATA_OUT_DIR / ".matches_upcoming_prev.json"

# Odds movement threshold: flag when implied probability shifts by more
# than this many percentage points between daily snapshots.
ODDS_MOVE_THRESHOLD_PTS = 8  # 8 percentage points

# Weather thresholds.
HEAT_THRESHOLD_C = 33.0
WIND_THRESHOLD_KMH = 30.0

# Tournament → approximate GPS coordinates for weather lookup.
# Covers major venues; unknown tournaments are skipped (no weather signal).
TOURNAMENT_COORDS: dict[str, tuple[float, float]] = {
    # ATP
    "ATP Australian Open": (-37.82, 144.98),
    "ATP French Open": (48.85, 2.25),
    "ATP Wimbledon": (51.43, -0.21),
    "ATP US Open": (40.75, -73.85),
    "ATP Indian Wells": (33.72, -116.30),
    "ATP Miami Open": (25.71, -80.16),
    "ATP Monte Carlo": (43.75, 7.33),
    "ATP Madrid Open": (40.37, -3.68),
    "ATP Rome": (41.93, 12.46),
    "ATP Barcelona Open": (41.39, 2.12),
    "ATP Munich": (48.17, 11.59),
    "ATP Canadian Open": (45.50, -73.57),
    "ATP Cincinnati Open": (39.10, -84.51),
    "ATP Shanghai": (31.04, 121.27),
    "ATP Paris": (48.84, 2.25),
    # WTA
    "WTA Australian Open": (-37.82, 144.98),
    "WTA French Open": (48.85, 2.25),
    "WTA Wimbledon": (51.43, -0.21),
    "WTA US Open": (40.75, -73.85),
    "WTA Indian Wells": (33.72, -116.30),
    "WTA Miami Open": (25.71, -80.16),
    "WTA Madrid Open": (40.37, -3.68),
    "WTA Rome": (41.93, 12.46),
    "WTA Canadian Open": (45.50, -73.57),
    "WTA Cincinnati Open": (39.10, -84.51),
    "WTA Stuttgart Open": (48.78, 9.18),
}


# --- Previous snapshot management ----------------------------------------

def load_prev_snapshot() -> dict[str, dict[str, Any]]:
    """Load the previous day's matches keyed by match id."""
    if not PREV_SNAPSHOT_PATH.exists():
        return {}
    try:
        data = json.loads(PREV_SNAPSHOT_PATH.read_text())
        return {m["id"]: m for m in data.get("matches", [])}
    except (json.JSONDecodeError, KeyError):
        return {}


def save_snapshot(payload: dict[str, Any]) -> None:
    """Save today's payload as the next day's 'previous' for comparison."""
    PREV_SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    PREV_SNAPSHOT_PATH.write_text(json.dumps(payload, ensure_ascii=False))


# --- Signal: odds movement -----------------------------------------------

def detect_odds_movements(
    current: list[dict[str, Any]],
    prev: dict[str, dict[str, Any]],
) -> dict[str, list[str]]:
    """Return {match_id: [signal strings]} for matches with big odds swings."""
    out: dict[str, list[str]] = {}
    for m in current:
        mid = m["id"]
        old = prev.get(mid)
        if not old:
            continue
        odds_a_now = m.get("oddsA")
        odds_a_prev = old.get("oddsA")
        odds_b_now = m.get("oddsB")
        odds_b_prev = old.get("oddsB")
        if not all([odds_a_now, odds_a_prev, odds_b_now, odds_b_prev]):
            continue
        # Compare implied probabilities.
        impl_a_now = 1.0 / odds_a_now
        impl_a_prev = 1.0 / odds_a_prev
        delta_pts = round((impl_a_now - impl_a_prev) * 100)
        if abs(delta_pts) >= ODDS_MOVE_THRESHOLD_PTS:
            direction = "hausse" if delta_pts > 0 else "baisse"
            out.setdefault(mid, []).append(
                f"📉 Cotes en {direction} ({'+' if delta_pts > 0 else ''}{delta_pts}pts en 24h)"
            )
    return out


# --- Signal: withdrawals -------------------------------------------------

def detect_withdrawals(
    current_ids: set[str],
    prev: dict[str, dict[str, Any]],
) -> list[dict[str, str]]:
    """Return list of {playerA, playerB, tournament} for matches that vanished."""
    withdrawn = []
    for mid, old in prev.items():
        if mid not in current_ids:
            withdrawn.append({
                "playerA": old.get("playerA", "?"),
                "playerB": old.get("playerB", "?"),
                "tournament": old.get("tournament", "?"),
            })
    return withdrawn


# --- Signal: weather ------------------------------------------------------

def fetch_weather(tournaments: set[str], dates: set[str]) -> dict[str, dict[str, Any]]:
    """Fetch weather for tournament locations. Returns {tournament: {temp, wind}}.

    Uses OpenMeteo free API — no key needed, 1 call per tournament.
    """
    if not dates:
        return {}
    # Use the earliest date for the forecast.
    target_date = min(dates)
    out: dict[str, dict[str, Any]] = {}
    for tourney in tournaments:
        coords = TOURNAMENT_COORDS.get(tourney)
        if not coords:
            continue
        lat, lon = coords
        try:
            r = httpx.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "temperature_2m_max,wind_speed_10m_max",
                    "start_date": target_date,
                    "end_date": target_date,
                    "timezone": "auto",
                },
                timeout=10.0,
            )
            r.raise_for_status()
            data = r.json()
            daily = data.get("daily", {})
            temps = daily.get("temperature_2m_max", [])
            winds = daily.get("wind_speed_10m_max", [])
            if temps and winds:
                out[tourney] = {
                    "tempMax": round(temps[0], 1),
                    "windMax": round(winds[0], 1),
                }
        except (httpx.HTTPError, httpx.TimeoutException, KeyError, IndexError) as exc:
            logger.warning("signals: weather fetch failed for %s: %s", tourney, exc)
    return out


def weather_signals(
    matches: list[dict[str, Any]],
    weather: dict[str, dict[str, Any]],
) -> dict[str, list[str]]:
    """Generate weather signals per match."""
    out: dict[str, list[str]] = {}
    for m in matches:
        w = weather.get(m.get("tournament", ""))
        if not w:
            continue
        mid = m["id"]
        temp = w.get("tempMax", 0)
        wind = w.get("windMax", 0)
        if temp >= HEAT_THRESHOLD_C:
            out.setdefault(mid, []).append(f"🥵 Chaleur extrême ({temp}°C)")
        if wind >= WIND_THRESHOLD_KMH:
            out.setdefault(mid, []).append(f"💨 Vent fort ({wind} km/h)")
    return out


# --- Main enrichment entry point -----------------------------------------

@dataclass
class SignalResult:
    """Signals to inject into matches_upcoming.json."""
    per_match: dict[str, list[str]]  # {match_id: [signal strings]}
    withdrawals: list[dict[str, str]]
    weather_data: dict[str, dict[str, Any]]  # {tournament: {tempMax, windMax}}


def enrich(payload: dict[str, Any]) -> SignalResult:
    """Run all signal detectors on a fresh matches payload.

    Call this AFTER build_upcoming_payload() and BEFORE write_upcoming().
    Mutates `payload["matches"]` by adding a `signals` list to each match,
    and adds top-level `withdrawals` and `weather` blocks.
    """
    matches = payload.get("matches", [])
    current_ids = {m["id"] for m in matches}
    prev = load_prev_snapshot()

    # 1. Odds movements.
    odds_signals = detect_odds_movements(matches, prev)

    # 2. Withdrawals.
    withdrawals = detect_withdrawals(current_ids, prev)

    # 3. Weather.
    tournaments = {m.get("tournament", "") for m in matches}
    dates = {m.get("date", "") for m in matches if m.get("date")}
    weather = fetch_weather(tournaments, dates)
    wx_signals = weather_signals(matches, weather)

    # Merge all signals per match.
    per_match: dict[str, list[str]] = {}
    for source in (odds_signals, wx_signals):
        for mid, sigs in source.items():
            per_match.setdefault(mid, []).extend(sigs)

    # Inject into payload.
    for m in matches:
        sigs = per_match.get(m["id"], [])
        if sigs:
            m["signals"] = sigs

    if withdrawals:
        payload["withdrawals"] = withdrawals

    if weather:
        payload["weather"] = {
            k: v for k, v in weather.items()
        }

    # Save current as next day's "previous" snapshot.
    save_snapshot(payload)

    return SignalResult(
        per_match=per_match,
        withdrawals=withdrawals,
        weather_data=weather,
    )
