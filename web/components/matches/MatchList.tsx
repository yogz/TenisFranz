"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Player, UpcomingMatch } from "@/lib/types";
import { MatchCard } from "./MatchCard";
import { TourFilter, type TourFilterValue } from "./TourFilter";

function groupByDay(matches: UpcomingMatch[]): { date: string; matches: UpcomingMatch[] }[] {
  // Sort by model confidence (most confident first) within each day.
  const sorted = [...matches].sort(
    (a, b) => Math.abs(b.modelProbA - 0.5) - Math.abs(a.modelProbA - 0.5),
  );
  const map = new Map<string, UpcomingMatch[]>();
  for (const m of sorted) {
    const arr = map.get(m.date) ?? [];
    arr.push(m);
    map.set(m.date, arr);
  }
  const days = Array.from(map.entries())
    .map(([date, matches]) => ({ date, matches }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return iso;
  }
}

export function MatchList({
  matches,
  players,
  weather,
}: {
  matches: UpcomingMatch[];
  players: Player[];
  weather?: Record<string, { tempMax: number; windMax: number }>;
}) {
  const search = useSearchParams();
  const urlTour = (search?.get("tour") ?? "all") as TourFilterValue;
  const [tour, setTour] = useState<TourFilterValue>(urlTour);

  // Keep tour state in sync with URL without a full rerender of the server tree.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (tour === "all") url.searchParams.delete("tour");
    else url.searchParams.set("tour", tour);
    window.history.replaceState(null, "", url);
  }, [tour]);

  const playerBySlug = useMemo(() => {
    const m = new Map<string, Player>();
    for (const p of players) m.set(p.slug, p);
    return m;
  }, [players]);

  const filtered = useMemo(
    () => matches.filter((m) => tour === "all" || m.tour === tour),
    [matches, tour],
  );
  const days = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <TourFilter value={tour} onChange={setTour} />
        <span className="text-[11px] text-muted">
          {filtered.length} match{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {days.length === 0 ? (
        <div className="card text-sm text-muted">
          Aucun match à venir dans les 7 prochains jours.
        </div>
      ) : (
        days.map((day) => (
          <section key={day.date} className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {formatDay(day.date)}
            </h2>
            <div className="space-y-3">
              {day.matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  playerA={playerBySlug.get(m.playerA)}
                  playerB={playerBySlug.get(m.playerB)}
                  weather={weather?.[m.tournament]}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
