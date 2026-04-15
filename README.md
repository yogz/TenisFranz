# TenisFranz

Transparent tennis match predictions, mobile-first.

TenisFranz predicts ATP & WTA match winners with a logistic-regression model trained on 15+ years of matches. The model is linear, explainable, and its track record is public.

## Architecture

```
TenisFranz/
├── web/          Next.js 15 app (Vercel, static)
├── pipeline/     Python package — ingests data, trains model, exports JSON
└── .github/workflows/  Nightly pipeline + CI
```

The pipeline runs nightly on GitHub Actions, emits JSON artifacts into `web/public/data/`, and Vercel auto-deploys on push. The site is 100% static: the tiny logistic model is shipped as JSON and inference runs in the browser.

## Develop locally

```bash
# Pipeline
cd pipeline
uv sync
uv run python -m tenisfranz.run_all --years 2020-2024
# writes JSON to ../web/public/data/

# Web
cd ../web
pnpm install
pnpm dev
```

## Data sources

- Jeff Sackmann `tennis_atp` and `tennis_wta` (matches 1968-present)
- tennis-data.co.uk (closing bookmaker odds)
