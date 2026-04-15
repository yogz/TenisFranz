# Data sources

## Training data (nightly pipeline)

- **Jeff Sackmann `tennis_atp` / `tennis_wta`** — match archive (ZIP from
  GitHub). Stable schema, MIT-licensed, ground truth for training.
- See `config.SACKMANN_REPOS`.

## Upcoming draws (daily `upcoming.yml`)

Status: **file-backed via env vars; live HTTP fetchers not yet wired.**

`draws_fetcher.py` exposes `fetch_atp()` and `fetch_wta()` which read a JSON
file at the path given by `TENISFRANZ_DRAWS_ATP` / `TENISFRANZ_DRAWS_WTA`.
Each file must be a JSON array conforming to `DrawMatch`:

```json
[
  {
    "tour": "atp",
    "date": "2026-04-18",
    "tournament": "Monte Carlo Masters",
    "round": "SF",
    "surface": "Clay",
    "player_a_last": "Alcaraz",
    "player_a_first": "Carlos",
    "player_b_last": "Sinner",
    "player_b_first": "Jannik",
    "tourney_level": "M"
  }
]
```

See `tests/fixtures/atp_draws_sample.json` and
`tests/fixtures/wta_draws_sample.json` for the authoritative shape contract.

### Before flipping live fetchers on

Checklist before adding an HTTP loader to `draws_fetcher.py`:

1. Open the tour website in Chrome DevTools → Network tab, navigate to the
   current tournament draw.
2. Identify the XHR that returns JSON (not HTML). Copy the URL.
3. `curl -sS '<url>' -H 'User-Agent: Mozilla/5.0'` and confirm the response
   is parseable JSON, not a 403 or a Cloudflare challenge.
4. Document the URL shape, rate limit observations, and exact field path to
   `(date, round, surface, playerA, playerB)` below.
5. Add an HTTP loader alongside the file loader; wire it through
   `_resolve_loader()` so production uses HTTP while tests stay on files.
6. Record the exact tournament categorization rules (Grand Slam → G,
   Masters → M, 500/250 → A, etc.) since `tourney_level` drives
   `config.TOURNEY_WEIGHTS` which feeds the model.
7. Set `vars.TENISFRANZ_DRAWS_ATP` / `vars.TENISFRANZ_DRAWS_WTA` in the
   GitHub Actions variables to disable the file override in production.

### Verified endpoints

_None yet._ Fill in as fetchers are verified.

## Historical bookmaker odds (Phase 4 — `historical_roi.py`)

- **tennis-data.co.uk** — weekly xlsx archives, 2005..last year.
- Used only for historical backtest. We publish aggregated ROI / bankroll
  curve / pick count, never individual match odds.
- Attribution mandatory in `/model` footer and in `vs_market.json.source`.
