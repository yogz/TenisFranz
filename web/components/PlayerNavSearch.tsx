"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import type { Player } from "@/lib/types";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { flag } from "@/lib/format";

export function PlayerNavSearch({
  players,
  excludeId,
}: {
  players: Player[];
  excludeId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

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

  const go = (p: Player) => {
    setQuery("");
    setOpen(false);
    router.push(`/players/${p.slug}` as never);
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
