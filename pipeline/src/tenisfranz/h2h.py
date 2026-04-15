"""Head-to-head aggregates for the player profile H2H block.

The matches DataFrame is walked once; for each (winner, loser) we bump a
counter on both sides. The exported JSON is keyed by tour-scoped player id
(matches the `players.json` `id` field, e.g. `atp-104925`) so the frontend
can do a direct O(1) lookup.

Schema:

```json
{
  "atp-104925": [
    {"opponent": "atp-105227", "wins": 7, "losses": 3, "bestSurface": "Clay"},
    ...
  ],
  ...
}
```

Each player's opponents list is sorted by matches played (desc) and capped
at `TOP_N` so the payload stays bounded. We keep only opponents with
≥ `MIN_MATCHES` matches to avoid a wall of single-match entries on the
frontend.
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import pandas as pd

from .config import SURFACES

TOP_N = 8
MIN_MATCHES = 2


def compute_h2h(tours_with_features: dict[str, pd.DataFrame]) -> dict[str, list[dict[str, Any]]]:
    """Walk matches per tour and emit the {player_id: [opponents]} mapping."""
    # Key every aggregate by tour so atp "1" vs wta "1" don't collide.
    pair_wins: dict[tuple[str, str, str, str], int] = defaultdict(int)
    pair_surface: dict[tuple[str, str, str], dict[str, int]] = defaultdict(
        lambda: {s: 0 for s in SURFACES},
    )
    seen_pairs: set[tuple[str, str, str]] = set()

    for tour, df in tours_with_features.items():
        if df is None or len(df) == 0:
            continue
        w_ids = df["winner_id"].astype(str).to_numpy()
        l_ids = df["loser_id"].astype(str).to_numpy()
        surfaces = df["surface"].astype(str).to_numpy()

        for i in range(len(df)):
            w, l, s = w_ids[i], l_ids[i], surfaces[i]
            a, b = sorted((w, l))
            seen_pairs.add((tour, a, b))
            pair_surface[(tour, a, b)][s] += 1
            pair_wins[(tour, a, b, w)] += 1

    # Build per-player opponent lists.
    out_raw: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for tour, a, b in seen_pairs:
        wins_a = pair_wins.get((tour, a, b, a), 0)
        wins_b = pair_wins.get((tour, a, b, b), 0)
        total = wins_a + wins_b
        if total < MIN_MATCHES:
            continue
        surf = pair_surface[(tour, a, b)]
        best_surface = max(surf.items(), key=lambda kv: kv[1])[0] if total else "Hard"

        a_tid = f"{tour}-{a}"
        b_tid = f"{tour}-{b}"
        out_raw[a_tid].append({
            "opponent": b_tid,
            "wins": wins_a,
            "losses": wins_b,
            "bestSurface": best_surface,
        })
        out_raw[b_tid].append({
            "opponent": a_tid,
            "wins": wins_b,
            "losses": wins_a,
            "bestSurface": best_surface,
        })

    # Sort by matches played desc, cap to TOP_N.
    out: dict[str, list[dict[str, Any]]] = {}
    for pid, opponents in out_raw.items():
        opponents.sort(key=lambda o: (o["wins"] + o["losses"]), reverse=True)
        out[pid] = opponents[:TOP_N]
    return out
