"""Shared configuration and constants."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PIPELINE_ROOT = REPO_ROOT / "pipeline"
CACHE_DIR = PIPELINE_ROOT / ".cache"
DATA_OUT_DIR = REPO_ROOT / "web" / "public" / "data"

SACKMANN_REPOS = {
    "atp": "https://github.com/JeffSackmann/tennis_atp/archive/refs/heads/master.zip",
    "wta": "https://github.com/JeffSackmann/tennis_wta/archive/refs/heads/master.zip",
}

SURFACES = ("Hard", "Clay", "Grass")

# Post-leak-fix feature set (2026-04). `form_diff` and `fatigue_diff` were
# dropped because:
#   - After fixing the intra-tournament ordering leak, `fatigue_diff`'s
#     coefficient collapsed from +1.08 to +0.06 (useless) — its pre-fix
#     magnitude was 95% leak artefact.
#   - `form_diff`'s coefficient stayed slightly negative (-0.09) due to
#     residual collinearity with elo_surface_diff. A near-zero-magnitude
#     feature with the "wrong" sign poisoned the explainability waterfall
#     and made user-facing adjustments unpredictable.
# The `w_form` / `w_fatigue` columns are still computed in the feature
# pipeline because the player-profile page surfaces recent form as a UX
# cue — they just aren't fed into the logistic regression anymore.
FEATURE_NAMES = (
    "elo_surface_diff",
    "serve_pts_won_diff",
    "return_pts_won_diff",
    "h2h_diff",
    "age_diff",
    "age_sq_diff",
    "tourney_weight",
)

TOURNEY_WEIGHTS = {
    "G": 4.0,  # Grand Slam
    "M": 3.0,  # Masters 1000
    "A": 2.0,  # ATP 500 / regular tour
    "F": 3.5,  # Tour Finals
    "D": 1.5,  # Davis Cup
    "C": 1.0,  # Challenger
    "S": 0.5,  # Satellite / ITF
}
