"""Strict name resolver for external sources → Sackmann player_id.

Design notes:
- Primary key is (last_normalized, first_initial, tour). Born-year used to
  disambiguate active-era collisions when available.
- Fuzzy matching is only used when the strict tuple fails AND the candidate
  set narrowed by last_norm has cardinality ≥ 2 — and even then only at
  threshold ≥ 97 with singleton-only acceptance.
- A miss returns None and increments a miss counter on the resolver
  instance. Callers should check `miss_ratio()` and hard-fail on >2%.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass, field
from typing import Any

try:
    from rapidfuzz import fuzz
except ImportError:  # pragma: no cover
    fuzz = None  # type: ignore

from .name_overrides import OVERRIDES

FUZZY_THRESHOLD = 97


# Special characters NFKD doesn't decompose (distinct letters, not accented).
_LIGATURES = str.maketrans({
    "đ": "dj", "Đ": "Dj",
    "ð": "d", "Ð": "D",
    "ø": "o", "Ø": "O",
    "ł": "l", "Ł": "L",
    "þ": "t", "Þ": "T",
    "æ": "ae", "Æ": "Ae",
    "œ": "oe", "Œ": "Oe",
    "ß": "ss",
})


def normalize(s: str) -> str:
    """Lowercase + strip accents + handle ligatures + collapse separators."""
    if s is None:
        return ""
    s = s.translate(_LIGATURES)
    folded = unicodedata.normalize("NFKD", s)
    ascii_only = "".join(c for c in folded if not unicodedata.combining(c))
    out = ascii_only.lower().replace("-", " ").replace(".", " ")
    # Collapse any internal double-spaces that came from the replacements.
    return " ".join(out.split())


def first_initial(first_name: str) -> str:
    n = normalize(first_name)
    return n[0] if n else ""


@dataclass
class _Candidate:
    player_id: str
    last_norm: str
    first_initial: str
    first_full: str  # for fuzzy disambiguation
    birth_year: int | None


@dataclass
class NameResolver:
    """Tour-scoped resolver. One instance per tour."""

    tour: str  # "atp" or "wta"
    candidates: list[_Candidate] = field(default_factory=list)
    _by_tuple: dict[tuple[str, str], list[_Candidate]] = field(default_factory=dict)
    _attempts: int = 0
    _misses: int = 0

    @classmethod
    def from_dataframe(cls, df: Any, tour: str) -> "NameResolver":
        """Build from a players DataFrame with columns player_id, name_first, name_last, dob."""
        r = cls(tour=tour)
        for row in df.itertuples(index=False):
            last = getattr(row, "name_last", None) or ""
            first = getattr(row, "name_first", None) or ""
            pid = str(getattr(row, "player_id"))
            dob = getattr(row, "dob", None)
            birth_year: int | None = None
            if dob is not None:
                try:
                    birth_year = int(str(dob)[:4])
                except (ValueError, TypeError):
                    pass
            cand = _Candidate(
                player_id=pid,
                last_norm=normalize(last),
                first_initial=first_initial(first),
                first_full=normalize(first),
                birth_year=birth_year,
            )
            r.candidates.append(cand)
            key = (cand.last_norm, cand.first_initial)
            r._by_tuple.setdefault(key, []).append(cand)
        return r

    def resolve(
        self,
        last: str,
        first_init: str | None = None,
        first_full: str | None = None,
        birth_year: int | None = None,
    ) -> str | None:
        self._attempts += 1
        last_n = normalize(last)
        if first_init is None and first_full:
            first_init = first_initial(first_full)
        init = (first_init or "").lower()

        # 1. Manual override
        override = OVERRIDES.get((self.tour, last_n, init))
        if override:
            return override

        # 2. Strict tuple
        key = (last_n, init)
        matches = self._by_tuple.get(key, [])

        if len(matches) == 1:
            return matches[0].player_id

        if len(matches) > 1:
            # Disambiguate by birth year if provided
            if birth_year is not None:
                for c in matches:
                    if c.birth_year == birth_year:
                        return c.player_id
            # Disambiguate by full first name if provided
            if first_full:
                target = normalize(first_full)
                for c in matches:
                    if c.first_full == target:
                        return c.player_id
            # Multiple candidates, can't choose — miss.
            self._misses += 1
            return None

        # 3. Fuzzy on last name only — accept if exactly one high-score hit
        if fuzz is not None and last_n:
            hits: list[_Candidate] = []
            for cand in self.candidates:
                score = fuzz.ratio(last_n, cand.last_norm)
                if score >= FUZZY_THRESHOLD and (not init or cand.first_initial == init):
                    hits.append(cand)
            if len(hits) == 1:
                return hits[0].player_id

        self._misses += 1
        return None

    def miss_ratio(self) -> float:
        if self._attempts == 0:
            return 0.0
        return self._misses / self._attempts

    def stats(self) -> dict[str, int | float]:
        return {
            "attempts": self._attempts,
            "misses": self._misses,
            "miss_ratio": self.miss_ratio(),
        }
