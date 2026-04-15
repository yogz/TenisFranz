"""Full pipeline entrypoint: ingest → features → train → backtest → export."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

from rich.console import Console
from rich.table import Table

from . import backtest, export, ingest, train

console = Console()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", default="2005-2025", help="range e.g. 2015-2024")
    args = parser.parse_args()

    year_from, year_to = (int(x) for x in args.years.split("-"))
    console.rule(f"TenisFranz pipeline — {year_from}-{year_to}")

    tours = ingest.load_all(year_from, year_to)

    console.rule("train")
    models_by_tour, elo_states = train.train_all(tours)

    console.rule("backtest")
    metrics_by_tour = {tour: backtest.run(df, tour) for tour, df in tours.items()}

    table = Table(title="Backtest accuracy")
    table.add_column("Tour")
    table.add_column("Accuracy", justify="right")
    table.add_column("LogLoss", justify="right")
    table.add_column("Brier", justify="right")
    table.add_column("N", justify="right")
    for tour, m in metrics_by_tour.items():
        table.add_row(tour, f"{m.accuracy:.3f}", f"{m.log_loss:.3f}", f"{m.brier:.3f}", f"{m.n_test}")
    console.print(table)

    console.rule("export")
    export.export_models(models_by_tour)
    export.export_backtest(metrics_by_tour)
    export.export_players_and_elo(tours, elo_states)
    export.export_meta(year_from, year_to, datetime.now(timezone.utc).isoformat())

    console.print("[green]done[/]")


if __name__ == "__main__":
    main()
