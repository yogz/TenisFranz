"""Manual name collision overrides.

Keys are `(tour, last_norm, first_initial)` tuples. Values are Sackmann
player_id strings. Use this file to pin real-world collisions that the
fuzzy resolver can't disambiguate from the candidate set alone.

Extend as misses surface in the wild.
"""

from __future__ import annotations

# Tuples of (tour, last_norm, first_initial) → player_id.
# Note: we don't put everyone here — just the ones where (last, initial)
# matches multiple active players.
OVERRIDES: dict[tuple[str, str, str], str] = {
    # Zverev brothers — both play ATP, first initial disambiguates but
    # some sources drop the initial. Prefer Alexander (active top-10).
    ("atp", "zverev", "a"): "100644",  # Alexander Zverev
    ("atp", "zverev", "m"): "105916",  # Mischa Zverev
    # Williams sisters — WTA.
    ("wta", "williams", "s"): "200033",  # Serena
    ("wta", "williams", "v"): "200034",  # Venus
    # Ruud — multiple Norwegian Ruuds on tour.
    ("atp", "ruud", "c"): "134770",  # Casper Ruud
    ("atp", "ruud", "c_sr"): "102358",  # Christian Ruud (father, mostly historical)
    # Medvedev — Daniil and Andrey are both active.
    ("atp", "medvedev", "d"): "106421",  # Daniil Medvedev
    ("atp", "medvedev", "a"): "104338",  # Andrey Medvedev (historical)
}
