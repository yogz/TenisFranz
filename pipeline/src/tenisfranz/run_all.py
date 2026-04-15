"""Full pipeline entrypoint: ingest → features → train → backtest → export."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone

from rich.console import Console
from rich.table import Table

from . import backtest, export, ingest, stats, train, wikidata

console = Console()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--years", default="2005-2025", help="range e.g. 2015-2024")
    parser.add_argument("--no-photos", action="store_true", help="skip Wikidata photo lookup")
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

    console.rule("stats")
    careers_by_tour = {tour: stats.compute_career(df) for tour, df in tours.items()}

    console.rule("player meta + photos")
    player_meta = {tour: ingest.load_players_meta(tour) for tour in tours}
    qids: list[str] = []
    for tour, df in tours.items():
        seen = set(df["winner_id"].astype(str)).union(df["loser_id"].astype(str))
        meta = player_meta[tour].set_index("player_id")
        for pid in seen:
            if pid in meta.index:
                q = meta.loc[pid, "wikidata_id"]
                if isinstance(q, str) and q.startswith("Q"):
                    qids.append(q)
    photos_by_qid = {} if args.no_photos else wikidata.resolve_photos(qids)

    console.rule("export")
    players = export.build_players(tours, elo_states, player_meta, careers_by_tour, photos_by_qid)
    export.export_models(models_by_tour)
    export.export_backtest(metrics_by_tour)
    export.export_players(players)
    export.export_elo(elo_states)
    export.export_meta(year_from, year_to, datetime.now(timezone.utc).isoformat())

    console.print(f"[green]done[/] — {len(players)} players exported")


if __name__ == "__main__":
    main()
