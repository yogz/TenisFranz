"""Resolve Wikidata QIDs → photo URLs via the SPARQL endpoint, with disk cache."""

from __future__ import annotations

import json
import time
import httpx
from rich.console import Console

from .config import CACHE_DIR

console = Console()

SPARQL = "https://query.wikidata.org/sparql"
CACHE_FILE = CACHE_DIR / "wikidata_photos.json"
BATCH = 80
USER_AGENT = (
    "TenisFranz/0.1 (https://github.com/yogz/TenisFranz; contact: tenisfranz@pm.me) "
    "python-httpx/0.27"
)


def _load_cache() -> dict[str, str | None]:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def _save_cache(cache: dict[str, str | None]) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False))


def _sparql_batch(client: httpx.Client, qids: list[str]) -> dict[str, str]:
    values = " ".join(f"wd:{q}" for q in qids)
    query = f"""
    SELECT ?p ?img WHERE {{
      VALUES ?p {{ {values} }}
      ?p wdt:P18 ?img.
    }}
    """
    r = client.get(
        SPARQL,
        params={"query": query, "format": "json"},
        headers={"User-Agent": USER_AGENT, "Accept": "application/sparql-results+json"},
        timeout=60.0,
    )
    r.raise_for_status()
    data = r.json()
    out: dict[str, str] = {}
    for binding in data.get("results", {}).get("bindings", []):
        p = binding["p"]["value"].rsplit("/", 1)[-1]  # e.g. Q1234
        # SPARQL already returns a fully-formed, percent-encoded Commons URL:
        # http://commons.wikimedia.org/wiki/Special:FilePath/Foo%20Bar.jpg
        img_url = binding["img"]["value"].replace("http://", "https://")
        # Append width parameter for a resized thumbnail
        sep = "&" if "?" in img_url else "?"
        out[p] = f"{img_url}{sep}width=400"
    return out


def resolve_photos(qids: list[str]) -> dict[str, str]:
    """Return {qid: photo_url} for any qid that has a P18 image on Wikidata.

    Caches hits *and* misses so repeat runs are free.
    """
    cache = _load_cache()
    clean_qids = sorted({q for q in qids if q and q.startswith("Q")})
    todo = [q for q in clean_qids if q not in cache]
    console.log(f"wikidata: {len(clean_qids)} qids ({len(todo)} to fetch)")

    with httpx.Client() as client:
        for start in range(0, len(todo), BATCH):
            chunk = todo[start : start + BATCH]
            try:
                found = _sparql_batch(client, chunk)
            except Exception as e:  # noqa: BLE001
                console.log(f"[yellow]sparql batch failed:[/] {e}")
                found = {}
            for q in chunk:
                cache[q] = found.get(q)  # either URL or None (miss)
            time.sleep(0.3)
            _save_cache(cache)

    _save_cache(cache)
    return {q: url for q, url in cache.items() if url and q in clean_qids}
