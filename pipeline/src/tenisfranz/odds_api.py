"""The Odds API client for upcoming tennis matches + bookmaker odds.

Free tier: 500 credits/month. Each /odds call costs 1 credit per
(market × region). We query h2h × eu = 1 credit per tournament.
With ~5-8 active tournaments, a daily cron uses ~200 credits/month.

Environment: ODDS_API_KEY must be set (GitHub secret → workflow env).

API docs: https://the-odds-api.com/liveapi/guides/v4/
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://api.the-odds-api.com/v4"
TIMEOUT = 30.0

# Map The Odds API sport keys to our (tour, surface, tourney_level).
# Surface is hardcoded per tournament since the API doesn't provide it.
# This mapping covers the major tournaments; unknown keys fall back to
# "Hard" / level "A" which is safe (most ATP/WTA events are Hard).
TOURNAMENT_META: dict[str, dict[str, str]] = {
    # ATP
    "tennis_atp_australian_open": {"surface": "Hard", "level": "G"},
    "tennis_atp_french_open": {"surface": "Clay", "level": "G"},
    "tennis_atp_wimbledon": {"surface": "Grass", "level": "G"},
    "tennis_atp_us_open": {"surface": "Hard", "level": "G"},
    "tennis_atp_indian_wells": {"surface": "Hard", "level": "M"},
    "tennis_atp_miami_open": {"surface": "Hard", "level": "M"},
    "tennis_atp_monte_carlo": {"surface": "Clay", "level": "M"},
    "tennis_atp_madrid_open": {"surface": "Clay", "level": "M"},
    "tennis_atp_rome": {"surface": "Clay", "level": "M"},
    "tennis_atp_canadian_open": {"surface": "Hard", "level": "M"},
    "tennis_atp_cincinnati_open": {"surface": "Hard", "level": "M"},
    "tennis_atp_shanghai": {"surface": "Hard", "level": "M"},
    "tennis_atp_paris": {"surface": "Hard", "level": "M"},
    # WTA
    "tennis_wta_australian_open": {"surface": "Hard", "level": "G"},
    "tennis_wta_french_open": {"surface": "Clay", "level": "G"},
    "tennis_wta_wimbledon": {"surface": "Grass", "level": "G"},
    "tennis_wta_us_open": {"surface": "Hard", "level": "G"},
    "tennis_wta_indian_wells": {"surface": "Hard", "level": "M"},
    "tennis_wta_miami_open": {"surface": "Hard", "level": "M"},
    "tennis_wta_madrid_open": {"surface": "Clay", "level": "M"},
    "tennis_wta_rome": {"surface": "Clay", "level": "M"},
    "tennis_wta_canadian_open": {"surface": "Hard", "level": "M"},
    "tennis_wta_cincinnati_open": {"surface": "Hard", "level": "M"},
}


@dataclass
class OddsMatch:
    """One upcoming match from The Odds API with averaged bookmaker odds."""
    tour: str           # "atp" | "wta"
    sport_key: str      # e.g. "tennis_atp_french_open"
    tournament: str     # human-readable
    commence_time: str  # ISO 8601
    player_a: str       # full name as the API reports it
    player_b: str
    odds_a: float | None  # average decimal odds on player A across books
    odds_b: float | None  # average decimal odds on player B
    surface: str        # "Hard" | "Clay" | "Grass"
    tourney_level: str  # "G" | "M" | "A"


def _get_api_key() -> str | None:
    return os.environ.get("ODDS_API_KEY")


def _tour_from_key(key: str) -> str | None:
    if key.startswith("tennis_atp"):
        return "atp"
    if key.startswith("tennis_wta"):
        return "wta"
    return None


def list_active_tennis_sports(api_key: str) -> list[dict]:
    """GET /v4/sports — free (0 credits). Returns all active sport keys."""
    try:
        r = httpx.get(
            f"{BASE_URL}/sports",
            params={"apiKey": api_key},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("odds_api: failed to list sports: %s", exc)
        return []
    return [
        s for s in r.json()
        if isinstance(s, dict)
        and s.get("group") == "Tennis"
        and s.get("active")
    ]


def fetch_odds_for_sport(api_key: str, sport_key: str) -> list[dict]:
    """GET /v4/sports/{key}/odds — 1 credit per call.

    Returns raw event dicts with bookmaker odds in decimal format.
    """
    try:
        r = httpx.get(
            f"{BASE_URL}/sports/{sport_key}/odds",
            params={
                "apiKey": api_key,
                "regions": "eu",
                "markets": "h2h",
                "oddsFormat": "decimal",
            },
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        # Log remaining credits.
        remaining = r.headers.get("x-requests-remaining")
        used = r.headers.get("x-requests-used")
        if remaining:
            logger.info("odds_api: credits remaining=%s used=%s", remaining, used)
    except httpx.HTTPError as exc:
        logger.warning("odds_api: failed to fetch %s: %s", sport_key, exc)
        return []
    data = r.json()
    return data if isinstance(data, list) else []


def _average_odds(event: dict) -> tuple[float | None, float | None]:
    """Average the decimal odds across all bookmakers for the h2h market.

    Returns (odds_home, odds_away) matching the event's `home_team` /
    `away_team` ordering. Returns (None, None) if no usable odds.
    """
    bookmakers = event.get("bookmakers", [])
    if not bookmakers:
        return None, None
    home = event.get("home_team", "")
    sums = [0.0, 0.0]
    counts = [0, 0]
    for bm in bookmakers:
        for market in bm.get("markets", []):
            if market.get("key") != "h2h":
                continue
            for outcome in market.get("outcomes", []):
                price = outcome.get("price")
                name = outcome.get("name")
                if price is None or price <= 1.0:
                    continue
                if name == home:
                    sums[0] += price
                    counts[0] += 1
                else:
                    sums[1] += price
                    counts[1] += 1
    odds_a = round(sums[0] / counts[0], 3) if counts[0] else None
    odds_b = round(sums[1] / counts[1], 3) if counts[1] else None
    return odds_a, odds_b


def fetch_all() -> list[OddsMatch]:
    """Fetch all upcoming tennis matches with odds.

    Returns an empty list (with a log warning) if the API key is missing
    or the API is unreachable — the caller treats this gracefully.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning("odds_api: ODDS_API_KEY not set, returning []")
        return []

    sports = list_active_tennis_sports(api_key)
    if not sports:
        logger.info("odds_api: no active tennis sports found")
        return []

    out: list[OddsMatch] = []
    for sport in sports:
        key = sport.get("key", "")
        tour = _tour_from_key(key)
        if not tour:
            continue
        title = sport.get("title", key)
        meta = TOURNAMENT_META.get(key, {"surface": "Hard", "level": "A"})

        events = fetch_odds_for_sport(api_key, key)
        for ev in events:
            home = ev.get("home_team", "")
            away = ev.get("away_team", "")
            if not home or not away:
                continue
            odds_a, odds_b = _average_odds(ev)
            out.append(OddsMatch(
                tour=tour,
                sport_key=key,
                tournament=title,
                commence_time=ev.get("commence_time", ""),
                player_a=home,
                player_b=away,
                odds_a=odds_a,
                odds_b=odds_b,
                surface=meta["surface"],
                tourney_level=meta["level"],
            ))

    logger.info("odds_api: fetched %d matches across %d sports", len(out), len(sports))
    return out
