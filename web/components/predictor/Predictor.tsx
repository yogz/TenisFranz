"use client";

import { useEffect, useState } from "react";
import type { EloRow, ModelBundle, Player, Surface, UpcomingMatch } from "@/lib/types";
import { pickModel, predict } from "@/lib/predict";
import { PlayerSearch } from "./PlayerSearch";
import { SurfacePicker } from "./SurfacePicker";
import { WaterfallChart } from "./WaterfallChart";
import { PredictionDetails } from "./PredictionDetails";
import {
  Adjustments,
  adjustmentsFromIds,
  adjIdsFromUrlParts,
  adjIdsToUrlParts,
} from "./Adjustments";

const SURFACES: Surface[] = ["Hard", "Clay", "Grass"];

// Client-side fetch of upcoming matches to show bookmaker odds on the
// prediction card when the selected pair exists in the upcoming list.
let upcomingPromise: Promise<UpcomingMatch[]> | null = null;
function fetchUpcoming(): Promise<UpcomingMatch[]> {
  if (upcomingPromise) return upcomingPromise;
  upcomingPromise = fetch("/data/matches_upcoming.json")
    .then((r) => (r.ok ? r.json() : { matches: [] }))
    .then((d) => d.matches ?? [])
    .catch(() => []);
  return upcomingPromise;
}

function findBySlug(players: Player[], slug: string | null): Player | null {
  if (!slug) return null;
  return players.find((p) => p.slug === slug) ?? null;
}

export function Predictor({
  players,
  elo,
  model,
}: {
  players: Player[];
  elo: EloRow[];
  model: ModelBundle;
}) {
  const [a, setA] = useState<Player | null>(null);
  const [b, setB] = useState<Player | null>(null);
  const [surface, setSurface] = useState<Surface>("Hard");
  const [adjIds, setAdjIds] = useState<Set<string>>(new Set());
  const [upcoming, setUpcoming] = useState<UpcomingMatch[]>([]);

  // Fetch upcoming matches once on mount (for bookmaker odds display).
  useEffect(() => {
    fetchUpcoming().then(setUpcoming);
  }, []);

  // Hydrate from URL on client mount. Lazy-read from window.location to
  // avoid the <Suspense> boundary re-render that useSearchParams would
  // trigger on every navigation. Unknown slugs are silently ignored.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const aSlug = params.get("a");
    const bSlug = params.get("b");
    const s = params.get("s");
    const ap = findBySlug(players, aSlug);
    const bp = findBySlug(players, bSlug);
    // Only accept a pair if both sides resolve AND tours match.
    if (ap && bp && ap.tour === bp.tour) {
      setA(ap);
      setB(bp);
    } else if (ap && !bp) {
      setA(ap);
    } else if (!ap && bp) {
      setB(bp);
    }
    if (s && (SURFACES as string[]).includes(s)) {
      setSurface(s as Surface);
    }
    const hydrated = adjIdsFromUrlParts(params.get("aAdj"), params.get("bAdj"));
    if (hydrated.size > 0) {
      setAdjIds(hydrated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync selection back to the URL without triggering a router re-render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (a) url.searchParams.set("a", a.slug);
    else url.searchParams.delete("a");
    if (b) url.searchParams.set("b", b.slug);
    else url.searchParams.delete("b");
    url.searchParams.set("s", surface);
    const { aAdj, bAdj } = adjIdsToUrlParts(adjIds);
    if (aAdj) url.searchParams.set("aAdj", aAdj);
    else url.searchParams.delete("aAdj");
    if (bAdj) url.searchParams.set("bAdj", bAdj);
    else url.searchParams.delete("bAdj");
    window.history.replaceState(null, "", url);
  }, [a, b, surface, adjIds]);

  const canPredict = a && b && a.tour === b.tour;
  let result: ReturnType<typeof predict> | null = null;
  let adjusted: ReturnType<typeof predict> | null = null;
  let trained: ReturnType<typeof pickModel> = undefined;
  if (canPredict) {
    trained = pickModel(model.models, a!.tour, surface);
    if (trained) {
      const cal = model.calibration?.[a!.tour];
      result = predict(a!, b!, elo, trained, surface, 2.0, undefined, cal);
      if (adjIds.size > 0) {
        adjusted = predict(
          a!, b!, elo, trained, surface, 2.0,
          adjustmentsFromIds(adjIds),
          cal,
        );
      }
    }
  }

  // Look up bookmaker odds for the selected pair in the upcoming matches.
  const bookieMatch = (a && b)
    ? upcoming.find(
        (m) =>
          (m.playerA === a.slug && m.playerB === b.slug) ||
          (m.playerA === b.slug && m.playerB === a.slug),
      )
    : undefined;

  const aWins = result ? result.probA >= result.probB : false;
  const winner = result && a && b ? (aWins ? a : b) : null;
  const loser = result && a && b ? (aWins ? b : a) : null;
  const pWinner = result ? Math.max(result.probA, result.probB) : 0;
  const pLoser = 1 - pWinner;
  // Adjusted prob is expressed for the same winner as the model picked,
  // so the delta reads naturally ("if you add this context, the favorite drops/gains").
  const pWinnerAdj = adjusted && result ? (aWins ? adjusted.probA : adjusted.probB) : null;
  const deltaPts =
    pWinnerAdj != null ? Math.round((pWinnerAdj - pWinner) * 100) : null;

  return (
    <div className="space-y-4">
      <PlayerSearch
        players={players}
        value={a}
        onChange={setA}
        placeholder="Joueur·euse A"
        excludeId={b?.id}
      />
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-border" />
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">vs</div>
        <div className="h-px flex-1 bg-border" />
      </div>
      <PlayerSearch
        players={b ? players.filter((p) => !a || p.tour === a.tour) : players}
        value={b}
        onChange={setB}
        placeholder="Joueur·euse B"
        excludeId={a?.id}
      />
      <SurfacePicker value={surface} onChange={setSurface} />

      {canPredict && (
        <Adjustments
          selected={adjIds}
          onChange={setAdjIds}
          playerAName={a!.name}
          playerBName={b!.name}
        />
      )}

      {a && b && a.tour !== b.tour && (
        <p className="text-sm text-muted">
          Les deux joueurs doivent être du même circuit (ATP ou WTA).
        </p>
      )}

      {result && winner && loser && (
        <div className="card card-hover space-y-6">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Favori
            </div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-medium text-text">{winner.name}</div>
                <div className="mt-0.5 truncate text-xs text-muted">
                  vs <span className="text-text/80">{loser.name}</span>
                </div>
              </div>
              <div className="font-display text-[56px] font-light leading-none text-lime">
                {(pWinner * 100).toFixed(0)}
                <span className="text-2xl text-lime/60">%</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full bg-lime transition-[width] duration-500"
                style={{ width: `${pWinner * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              <span>{winner.name.split(" ").pop()} {(pWinner * 100).toFixed(0)}%</span>
              <span>{(pLoser * 100).toFixed(0)}% {loser.name.split(" ").pop()}</span>
            </div>
            {bookieMatch?.oddsA != null && bookieMatch?.oddsB != null && (() => {
              // Align bookie odds to winner/loser (same order as the card).
              const isSwapped = bookieMatch.playerA === b!.slug;
              const oddsW = isSwapped
                ? (aWins ? bookieMatch.oddsB : bookieMatch.oddsA)
                : (aWins ? bookieMatch.oddsA : bookieMatch.oddsB);
              const oddsL = isSwapped
                ? (aWins ? bookieMatch.oddsA : bookieMatch.oddsB)
                : (aWins ? bookieMatch.oddsB : bookieMatch.oddsA);
              const bkWinner = Math.round((1 / oddsW) * 100);
              const bkLoser = Math.round((1 / oddsL) * 100);
              return (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                    Bookmakers
                  </div>
                  <div className="flex items-baseline gap-3 text-[11px]">
                    <span className="text-muted">
                      {winner.name.split(" ").pop()}{" "}
                      <span className="font-mono text-text">{bkWinner}%</span>
                    </span>
                    <span className="text-muted/50">·</span>
                    <span className="text-muted">
                      <span className="font-mono text-text">{bkLoser}%</span>{" "}
                      {loser.name.split(" ").pop()}
                    </span>
                  </div>
                </div>
              );
            })()}
            {pWinnerAdj != null && deltaPts != null && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                  Avec tes ajustements
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-text">
                    {(pWinnerAdj * 100).toFixed(0)}
                    <span className="text-sm text-muted">%</span>
                  </span>
                  <span
                    className={
                      "font-mono text-[11px] " +
                      (deltaPts > 0
                        ? "text-lime"
                        : deltaPts < 0
                        ? "text-red-400"
                        : "text-muted")
                    }
                  >
                    {deltaPts > 0 ? "+" : ""}
                    {deltaPts}pts
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-5">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Pourquoi
            </div>
            <WaterfallChart
              contributions={result.contributions}
              playerAName={a!.name.split(" ").pop() ?? a!.name}
              playerBName={b!.name.split(" ").pop() ?? b!.name}
            />
          </div>

          {trained && (
            <PredictionDetails
              result={result}
              playerA={a!}
              playerB={b!}
              surface={surface}
              model={trained}
              winnerIsA={aWins}
            />
          )}
        </div>
      )}
    </div>
  );
}
