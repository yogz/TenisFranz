"""ATP/WTA upcoming draws fetcher.

Scope: return a normalized list of `DrawMatch` entries for matches scheduled
in the next ~7 days. Schedules only — no odds, no results.

## Source status (2026-04)

Both ATP and WTA publish bracket data via their tour websites but the JSON
endpoints are not formally documented and can change shape without notice.
We treat this module as the **trust boundary** between the outside world and
our pipeline:

1. Every fetcher lives behind a single `fetch()` entrypoint returning
   `list[DrawMatch]`.
2. On HTTP or parse failure, the fetcher returns `[]` and logs a warning.
   `upcoming.py` handles the empty case gracefully (seeds empty JSON).
3. Canned fixtures live at `tests/fixtures/{atp,wta}_draws_sample.json` and
   are the authoritative shape contract — tests freeze that contract.
4. Before flipping the live fetchers on in production, see
   `docs/data_sources.md` for the manual verification checklist.

Until we verify the real endpoints, `fetch_atp()` / `fetch_wta()` delegate
to a pluggable loader that can be wired to a local file, a test fixture, or
(eventually) a verified HTTP endpoint via environment variables.
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable

logger = logging.getLogger(__name__)


@dataclass
class DrawMatch:
    """One scheduled match extracted from a tour draw.

    Names are raw strings as they appear upstream — resolution to Sackmann
    player_id happens later in `upcoming.py`.
    """

    tour: str              # "atp" | "wta"
    date: str              # ISO yyyy-mm-dd (scheduled day)
    tournament: str        # human-readable tournament name
    round: str             # "R128" | "R64" | "R32" | "R16" | "QF" | "SF" | "F"
    surface: str           # "Hard" | "Clay" | "Grass"
    player_a_last: str
    player_a_first: str
    player_b_last: str
    player_b_first: str
    tourney_level: str = "A"  # maps to config.TOURNEY_WEIGHTS
    # Bookmaker odds (decimal, averaged across books). None if the source
    # doesn't provide odds (e.g. file-backed loader).
    odds_a: float | None = None
    odds_b: float | None = None


# --- Loader plumbing ---------------------------------------------------

Loader = Callable[[], list[DrawMatch]]


def _empty_loader() -> list[DrawMatch]:
    """Default loader when no source is configured. Returns []."""
    logger.warning(
        "draws_fetcher: no loader configured for tour. "
        "Set TENISFRANZ_DRAWS_ATP / TENISFRANZ_DRAWS_WTA env var to a JSON file "
        "conforming to DrawMatch[] schema.",
    )
    return []


def _file_loader(path: Path) -> Loader:
    """Load DrawMatch[] from a local JSON file. Used for fixtures + CI seeds."""

    def _load() -> list[DrawMatch]:
        if not path.exists():
            logger.warning("draws_fetcher: file %s not found, returning []", path)
            return []
        try:
            raw = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError) as exc:
            logger.error("draws_fetcher: failed to parse %s: %s", path, exc)
            return []
        return _parse_list(raw)

    return _load


def _parse_list(raw: object) -> list[DrawMatch]:
    """Convert raw list-of-dicts into DrawMatch list, skipping malformed rows."""
    if not isinstance(raw, list):
        logger.error("draws_fetcher: expected top-level list, got %s", type(raw).__name__)
        return []
    out: list[DrawMatch] = []
    for i, row in enumerate(raw):
        if not isinstance(row, dict):
            logger.warning("draws_fetcher: row %d not a dict, skipping", i)
            continue
        try:
            out.append(DrawMatch(
                tour=str(row["tour"]),
                date=str(row["date"]),
                tournament=str(row["tournament"]),
                round=str(row["round"]),
                surface=str(row["surface"]),
                player_a_last=str(row["player_a_last"]),
                player_a_first=str(row.get("player_a_first", "")),
                player_b_last=str(row["player_b_last"]),
                player_b_first=str(row.get("player_b_first", "")),
                tourney_level=str(row.get("tourney_level", "A")),
            ))
        except (KeyError, TypeError, ValueError) as exc:
            logger.warning("draws_fetcher: row %d malformed (%s), skipping", i, exc)
    return out


def _resolve_loader(tour: str) -> Loader:
    env = os.environ.get(f"TENISFRANZ_DRAWS_{tour.upper()}")
    if env:
        return _file_loader(Path(env))
    return _empty_loader


def _odds_api_loader() -> list[DrawMatch]:
    """Fetch from The Odds API (requires ODDS_API_KEY env var).

    Converts OddsMatch → DrawMatch, splitting the full player name
    (e.g. "Carlos Alcaraz") into first/last. Round is unavailable from
    the API so we default to an empty string.
    """
    try:
        from . import odds_api
    except ImportError:
        logger.warning("draws_fetcher: odds_api module not available")
        return []

    matches = odds_api.fetch_all()
    out: list[DrawMatch] = []
    for m in matches:
        # Split "Carlos Alcaraz" → first="Carlos", last="Alcaraz"
        parts_a = m.player_a.rsplit(" ", 1)
        parts_b = m.player_b.rsplit(" ", 1)
        first_a = parts_a[0] if len(parts_a) > 1 else ""
        last_a = parts_a[-1]
        first_b = parts_b[0] if len(parts_b) > 1 else ""
        last_b = parts_b[-1]
        # Date from ISO commence_time
        date = m.commence_time[:10] if m.commence_time else ""
        out.append(DrawMatch(
            tour=m.tour,
            date=date,
            tournament=m.tournament,
            round="",  # not available from The Odds API
            surface=m.surface,
            player_a_last=last_a,
            player_a_first=first_a,
            player_b_last=last_b,
            player_b_first=first_b,
            tourney_level=m.tourney_level,
            odds_a=m.odds_a,
            odds_b=m.odds_b,
        ))
    return out


def fetch_atp() -> list[DrawMatch]:
    """Fetch upcoming ATP matches. File-backed or Odds API."""
    return _resolve_loader("atp")()


def fetch_wta() -> list[DrawMatch]:
    """Fetch upcoming WTA matches. File-backed or Odds API."""
    return _resolve_loader("wta")()


def fetch_all() -> list[DrawMatch]:
    """Fetch all upcoming matches. Prefers The Odds API if ODDS_API_KEY is
    set; falls back to per-tour file loaders if not."""
    if os.environ.get("ODDS_API_KEY"):
        logger.info("draws_fetcher: using The Odds API (ODDS_API_KEY is set)")
        return _odds_api_loader()
    return fetch_atp() + fetch_wta()


def to_dict(m: DrawMatch) -> dict:
    return asdict(m)
