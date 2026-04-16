"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import type { Player } from "@/lib/types";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { flag } from "@/lib/format";

/**
 * Lightweight player record for the search dropdown — only the fields the
 * component actually uses, to keep the client-side fetch small.
 *
 * The full `Player` type carries career stats, Elo tables, last-10 arrays
 * etc. that the nav search never touches but that inflated the per-page
 * RSC payload to ~2 MB when passed as props (4126 pages × 2 MB = 13 GB of
 * output → ENOSPC on Vercel). Loading the data client-side instead of
 * receiving it as props eliminates that entirely.
 */
interface SearchPlayer {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  countryIso: string | null;
  tour: string;
  rank: number;
  photoUrl: string | null;
}

/** Fetch the full players.json once (browser caches it), then extract the
 * minimal fields for the search index. ~2.9 MB raw, ~400 KB gzipped. */
let fetchPromise: Promise<SearchPlayer[]> | null = null;

function fetchSearchPlayers(): Promise<SearchPlayer[]> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/data/players.json")
    .then((r) => (r.ok ? r.json() : []))
    .then((all: Player[]) =>
      all.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        country: p.country,
        countryIso: p.countryIso,
        tour: p.tour,
        rank: p.rank,
        photoUrl: p.photoUrl,
      })),
    )
    .catch(() => []);
  return fetchPromise;
}

export function PlayerNavSearch({
  tour,
  excludeId,
}: {
  /** Only show players from this tour (pre-filter). */
  tour: string;
  excludeId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<SearchPlayer[]>([]);

  // Fetch on mount — the module-level promise deduplicates concurrent loads.
  useEffect(() => {
    fetchSearchPlayers().then((all) =>
      setPlayers(all.filter((p) => p.tour === tour)),
    );
  }, [tour]);

  const fuse = useMemo(
    () =>
      new Fuse(players, {
        keys: ["name", "country"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [players],
  );

  const results = useMemo(() => {
    const base = query ? fuse.search(query).map((r) => r.item) : players;
    return base.filter((p) => p.id !== excludeId).slice(0, 8);
  }, [fuse, players, query, excludeId]);

  const go = (p: SearchPlayer) => {
    setQuery("");
    setOpen(false);
    router.push(`/players/${p.slug}`);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 focus-within:border-lime/40 focus-within:shadow-[0_0_0_1px_rgba(204,255,0,0.2)] transition">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Chercher un autre joueur…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface2 shadow-xl">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(p);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface"
              >
                <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted">
                    {p.countryIso && <span>{flag(p.countryIso)} </span>}
                    {p.country ?? "—"} · {p.tour.toUpperCase()}
                  </div>
                </div>
                <div className="text-xs text-muted">#{p.rank}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
