"""Download and load Jeff Sackmann match data."""

from __future__ import annotations

import io
import re
import zipfile
from pathlib import Path

import httpx
import pandas as pd
from rich.console import Console

from .config import CACHE_DIR, SACKMANN_REPOS

console = Console()

MATCH_COLUMNS = [
    "tourney_id",
    "tourney_name",
    "surface",
    "tourney_level",
    "tourney_date",
    "match_num",
    "winner_id",
    "winner_name",
    "winner_ioc",
    "winner_age",
    "loser_id",
    "loser_name",
    "loser_ioc",
    "loser_age",
    "score",
    "best_of",
    "round",
    "minutes",
    "w_ace",
    "w_df",
    "w_svpt",
    "w_1stIn",
    "w_1stWon",
    "w_2ndWon",
    "w_SvGms",
    "w_bpSaved",
    "w_bpFaced",
    "l_ace",
    "l_df",
    "l_svpt",
    "l_1stIn",
    "l_1stWon",
    "l_2ndWon",
    "l_SvGms",
    "l_bpSaved",
    "l_bpFaced",
]


def _download_zip(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        console.log(f"[dim]cache hit[/] {dest.name}")
        return dest
    console.log(f"downloading {url}")
    with httpx.stream("GET", url, follow_redirects=True, timeout=120.0) as r:
        r.raise_for_status()
        with dest.open("wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    return dest


def load_tour(tour: str, year_from: int, year_to: int) -> pd.DataFrame:
    """Return a DataFrame of matches for a tour across the given year range (inclusive)."""
    if tour not in SACKMANN_REPOS:
        raise ValueError(f"unknown tour: {tour}")
    zip_path = _download_zip(SACKMANN_REPOS[tour], CACHE_DIR / f"tennis_{tour}.zip")

    # Main-tour singles only: `atp_matches_YYYY.csv` (not qual_chall, futures, amateur, doubles).
    main_tour_re = re.compile(rf"(^|/){tour}_matches_(\d{{4}})\.csv$")
    frames: list[pd.DataFrame] = []
    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            m = main_tour_re.search(name)
            if not m:
                continue
            year = int(m.group(2))
            if not (year_from <= year <= year_to):
                continue
            with zf.open(name) as f:
                df = pd.read_csv(io.BytesIO(f.read()), low_memory=False)
            df["tour"] = tour
            frames.append(df)

    if not frames:
        raise RuntimeError(f"no match files found for {tour} {year_from}-{year_to}")

    out = pd.concat(frames, ignore_index=True)
    out["tourney_date"] = pd.to_datetime(out["tourney_date"], format="%Y%m%d", errors="coerce")
    out = out.dropna(subset=["tourney_date", "winner_id", "loser_id", "surface"])
    out = out[out["surface"].isin(["Hard", "Clay", "Grass"])]
    out = out.sort_values("tourney_date").reset_index(drop=True)

    for col in MATCH_COLUMNS:
        if col not in out.columns:
            out[col] = None

    console.log(f"[green]{tour}[/] loaded {len(out):,} matches")
    return out


def load_all(year_from: int, year_to: int) -> dict[str, pd.DataFrame]:
    return {tour: load_tour(tour, year_from, year_to) for tour in SACKMANN_REPOS}


def load_players_meta(tour: str) -> pd.DataFrame:
    """Load `{tour}_players.csv` — metadata: name, hand, dob, ioc, height, wikidata_id."""
    zip_path = CACHE_DIR / f"tennis_{tour}.zip"
    if not zip_path.exists():
        _download_zip(SACKMANN_REPOS[tour], zip_path)

    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            if name.endswith(f"{tour}_players.csv"):
                with zf.open(name) as f:
                    df = pd.read_csv(io.BytesIO(f.read()), low_memory=False, dtype=str)
                break
        else:
            raise RuntimeError(f"{tour}_players.csv not found in zip")

    df["tour"] = tour
    df["player_id"] = df["player_id"].astype(str)
    # normalize
    for col in ("name_first", "name_last", "hand", "ioc", "height", "wikidata_id", "dob"):
        if col not in df.columns:
            df[col] = None
    return df
