"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Search, X, Zap } from "lucide-react";
import type { Player, UpcomingMatch } from "@/lib/types";
import { cn } from "@/lib/cn";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { flag } from "@/lib/format";

const PAGE_SIZE = 12;

// Client-side fetch of upcoming matches (shared with Predictor).
let upcomingPromise: Promise<UpcomingMatch[]> | null = null;
function fetchUpcoming(): Promise<UpcomingMatch[]> {
  if (upcomingPromise) return upcomingPromise;
  upcomingPromise = fetch("/data/matches_upcoming.json")
    .then((r) => (r.ok ? r.json() : { matches: [] }))
    .then((d) => d.matches ?? [])
    .catch(() => []);
  return upcomingPromise;
}

interface Props {
  players: Player[];
  value: Player | null;
  onChange: (player: Player | null) => void;
  placeholder: string;
  excludeId?: string;
}

export function PlayerSearch({ players, value, onChange, placeholder, excludeId }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [upcoming, setUpcoming] = useState<UpcomingMatch[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { fetchUpcoming().then(setUpcoming); }, []);

  // Reset limit when query changes.
  useEffect(() => { setLimit(PAGE_SIZE); }, [query]);

  const fuse = useMemo(
    () => new Fuse(players, {
      keys: ["name", "country"],
      threshold: 0.35,
      ignoreLocation: true,
    }),
    [players],
  );

  // Set of player slugs that play today (for priority sorting).
  const todaySlugs = useMemo(() => {
    const set = new Set<string>();
    for (const m of upcoming) {
      set.add(m.playerA);
      set.add(m.playerB);
    }
    return set;
  }, [upcoming]);

  // Players sorted: today's matches first, then by rank.
  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const aToday = todaySlugs.has(a.slug) ? 0 : 1;
      const bToday = todaySlugs.has(b.slug) ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      return a.rank - b.rank;
    });
  }, [players, todaySlugs]);

  const results = useMemo(() => {
    if (!query) {
      return sorted
        .filter((p) => p.id !== excludeId)
        .slice(0, limit);
    }
    return fuse
      .search(query)
      .map((r) => r.item)
      .filter((p) => p.id !== excludeId)
      .slice(0, limit);
  }, [fuse, sorted, query, excludeId, limit]);

  const hasMore = useMemo(() => {
    if (!query) return sorted.filter((p) => p.id !== excludeId).length > limit;
    return fuse.search(query).filter((r) => r.item.id !== excludeId).length > limit;
  }, [fuse, sorted, query, excludeId, limit]);

  // Infinite scroll: load more when user reaches near bottom.
  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      setLimit((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  if (value) {
    return (
      <button
        type="button"
        onClick={() => onChange(null)}
        className="flex w-full items-center gap-3 rounded-xl border border-lime/40 bg-lime-soft px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <PlayerAvatar name={value.name} photoUrl={value.photoUrl} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-text">{value.name}</div>
          <div className="truncate text-xs text-muted">
            {value.countryIso && <span>{flag(value.countryIso)} </span>}
            {value.country ?? "—"} · #{value.rank} · {value.tour.toUpperCase()}
          </div>
        </div>
        <X className="size-4 shrink-0 text-muted" />
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-3.5 focus-within:border-lime/40 focus-within:shadow-[0_0_0_1px_rgba(204,255,0,0.2)] transition">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </div>
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          onScroll={onScroll}
          className="absolute z-10 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface2 shadow-xl"
        >
          {results.map((p) => {
            const isToday = todaySlugs.has(p.slug);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(p);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface",
                  )}
                >
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {p.name}
                      {isToday && (
                        <Zap className="size-3 text-lime" />
                      )}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {p.countryIso && <span>{flag(p.countryIso)} </span>}
                      {p.country ?? "—"} · {p.tour.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-xs text-muted">#{p.rank}</div>
                </button>
              </li>
            );
          })}
          {hasMore && (
            <li className="px-4 py-2 text-center text-[11px] text-muted/60">
              Défile pour voir plus…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
