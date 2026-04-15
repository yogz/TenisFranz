"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import type { Player } from "@/lib/types";
import { cn } from "@/lib/cn";

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
    if (!query) return players.slice(0, 8);
    return fuse
      .search(query)
      .slice(0, 8)
      .map((r) => r.item);
  }, [fuse, players, query]);

  if (value) {
    return (
      <button
        type="button"
        onClick={() => onChange(null)}
        className="flex w-full items-center justify-between rounded-xl border border-lime/40 bg-lime-soft px-4 py-4 text-left"
      >
        <div>
          <div className="text-base font-semibold text-text">{value.name}</div>
          <div className="text-xs text-muted">
            {value.country ?? "—"} · #{value.rank} · {value.tour.toUpperCase()}
          </div>
        </div>
        <X className="size-4 text-muted" />
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
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface2 shadow-xl">
          {results
            .filter((p) => p.id !== excludeId)
            .map((p) => (
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
                    "flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface",
                  )}
                >
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">
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
