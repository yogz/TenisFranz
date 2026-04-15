"""Feature computation modules.

Every feature here is computed *pre-match*: for row `i` the feature value reflects
only data available before `tourney_date[i]`. This keeps backtests honest and
mirrors what the served model sees in production.
"""

from . import age, elo_surface, fatigue, form, h2h_bayes, serve_return, tourney_weight

__all__ = [
    "age",
    "elo_surface",
    "fatigue",
    "form",
    "h2h_bayes",
    "serve_return",
    "tourney_weight",
]
