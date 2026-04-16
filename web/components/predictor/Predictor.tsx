"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EloRow, ModelBundle, Player, Surface, UpcomingMatch } from "@/lib/types";
import { blendWithMarket, pickModel, predict } from "@/lib/predict";
import { PlayerSearch } from "./PlayerSearch";
import { SurfacePicker } from "./SurfacePicker";
import { WaterfallChart } from "./WaterfallChart";
import { PredictionDetails } from "./PredictionDetails";
import {
  Adjustments,
  adjustmentsFromIds,
  adjIdsFromUrlParts,
  adjIdsToUrlParts,
  type AdjustmentContext,
} from "./Adjustments";

const SURFACES: Surface[] = ["Hard", "Clay", "Grass"];

interface UpcomingData {
  matches: UpcomingMatch[];
  weather?: Record<string, { tempMax: number; windMax: number }>;
}

let upcomingPromise: Promise<UpcomingData> | null = null;
function fetchUpcoming(): Promise<UpcomingData> {
  if (upcomingPromise) return upcomingPromise;
  upcomingPromise = fetch("/data/matches_upcoming.json")
    .then((r) => (r.ok ? r.json() : { matches: [] }))
    .then((d) => ({ matches: d.matches ?? [], weather: d.weather }))
    .catch(() => ({ matches: [] }));
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
  const [upcomingData, setUpcomingData] = useState<UpcomingData>({ matches: [] });
  const [adjOpen, setAdjOpen] = useState(false);

  useEffect(() => { fetchUpcoming().then(setUpcomingData); }, []);

  const upcoming = upcomingData.matches;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ap = findBySlug(players, params.get("a"));
    const bp = findBySlug(players, params.get("b"));
    const s = params.get("s");
    if (ap && bp && ap.tour === bp.tour) { setA(ap); setB(bp); }
    else if (ap) setA(ap);
    else if (bp) setB(bp);
    if (s && (SURFACES as string[]).includes(s)) setSurface(s as Surface);
    const hydrated = adjIdsFromUrlParts(params.get("aAdj"), params.get("bAdj"));
    if (hydrated.size > 0) { setAdjIds(hydrated); setAdjOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (a) url.searchParams.set("a", a.slug); else url.searchParams.delete("a");
    if (b) url.searchParams.set("b", b.slug); else url.searchParams.delete("b");
    url.searchParams.set("s", surface);
    const { aAdj, bAdj } = adjIdsToUrlParts(adjIds);
    if (aAdj) url.searchParams.set("aAdj", aAdj); else url.searchParams.delete("aAdj");
    if (bAdj) url.searchParams.set("bAdj", bAdj); else url.searchParams.delete("bAdj");
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
        adjusted = predict(a!, b!, elo, trained, surface, 2.0, adjustmentsFromIds(adjIds), cal);
      }
    }
  }

  const bookieMatch = (a && b)
    ? upcoming.find((m) =>
        (m.playerA === a.slug && m.playerB === b.slug) ||
        (m.playerA === b.slug && m.playerB === a.slug))
    : undefined;

  // Resolve bookie odds in the A/B frame (before computing aWins so
  // the blend can influence who is displayed as favorite).
  let oddsForA: number | undefined;
  let oddsForB: number | undefined;
  if (bookieMatch?.oddsA != null && bookieMatch?.oddsB != null && a && b) {
    const isSwapped = bookieMatch.playerA === b.slug;
    oddsForA = isSwapped ? bookieMatch.oddsB : bookieMatch.oddsA;
    oddsForB = isSwapped ? bookieMatch.oddsA : bookieMatch.oddsB;
  }

  // Blend model prediction with bookmaker odds (65% model + 35% market).
  // This is the "smart" probability that combines our historical model
  // with the market's live information edge.
  const blendedProbA = result
    ? blendWithMarket(result.probA, oddsForA, oddsForB)
    : 0;
  const hasBlend = result && oddsForA != null;

  // Use blended probability for the display when market data is available.
  const displayProbA = hasBlend ? blendedProbA : (result?.probA ?? 0);
  const aWins = displayProbA >= 0.5;
  const winner = result && a && b ? (aWins ? a : b) : null;
  const loser = result && a && b ? (aWins ? b : a) : null;
  const pWinner = result ? Math.max(displayProbA, 1 - displayProbA) : 0;
  const pLoser = 1 - pWinner;

  // Raw model probability (before blend) for reference.
  const pWinnerModelOnly = result ? (aWins ? result.probA : result.probB) : 0;

  // Adjusted probability: blend the adjusted model output with market too.
  let pWinnerAdj: number | null = null;
  let deltaPts: number | null = null;
  if (adjusted && result) {
    const adjBlended = blendWithMarket(adjusted.probA, oddsForA, oddsForB);
    const adjDisplay = hasBlend ? adjBlended : adjusted.probA;
    pWinnerAdj = aWins ? adjDisplay : (1 - adjDisplay);
    deltaPts = Math.round((pWinnerAdj - pWinner) * 100);
  }

  // Bookie prob on winner side (for display + suggestion).
  let bookieProbWinner: number | undefined;
  if (oddsForA != null && oddsForB != null) {
    const implA = 1 / oddsForA;
    const implB = 1 / oddsForB!;
    const total = implA + implB;
    bookieProbWinner = aWins ? implA / total : implB / total;
  }

  const bookieGap = bookieProbWinner != null ? Math.round((pWinner - bookieProbWinner) * 100) : 0;
  const showSuggestion = canPredict && result && bookieProbWinner != null && Math.abs(bookieGap) >= 8 && adjIds.size === 0;

  return (
    <div className="space-y-4">
      <PlayerSearch players={players} value={a} onChange={setA} placeholder="Joueur·euse A" excludeId={b?.id} />
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-border" />
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">vs</div>
        <div className="h-px flex-1 bg-border" />
      </div>
      <PlayerSearch
        players={b ? players.filter((p) => !a || p.tour === a.tour) : players}
        value={b} onChange={setB} placeholder="Joueur·euse B" excludeId={a?.id}
      />
      <SurfacePicker value={surface} onChange={setSurface} />

      {a && b && a.tour !== b.tour && (
        <p className="text-sm text-muted">Les deux joueurs doivent être du même circuit (ATP ou WTA).</p>
      )}

      {result && winner && loser && (
        <div className="card card-hover space-y-5">
          {/* ── Header: favorite + score (+ adjusted score inline) ── */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Favori</span>
              {hasBlend && (
                <span className="rounded-full bg-lime/10 px-2 py-0.5 text-[9px] font-medium text-lime/70">
                  modèle + marché
                </span>
              )}
            </div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-medium text-text">{winner.name}</div>
                <div className="mt-0.5 truncate text-xs text-muted">
                  vs <span className="text-text/80">{loser.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[48px] font-light leading-none text-lime">
                  {(pWinner * 100).toFixed(0)}
                  <span className="text-2xl text-lime/60">%</span>
                </div>
                {/* Adjusted score shown inline under the main score */}
                {pWinnerAdj != null && deltaPts != null && (
                  <div className="mt-1 flex items-baseline justify-end gap-1.5">
                    <span className="text-[10px] text-muted">ajusté</span>
                    <span className="font-mono text-lg text-text">
                      {(pWinnerAdj * 100).toFixed(0)}%
                    </span>
                    <span
                      className={
                        "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold " +
                        (deltaPts > 0
                          ? "bg-lime/15 text-lime"
                          : deltaPts < 0
                          ? "bg-red-400/15 text-red-300"
                          : "text-muted")
                      }
                    >
                      {deltaPts > 0 ? "+" : ""}{deltaPts}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Probability bar — with optional adjusted overlay */}
            <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-surface2">
              {pWinnerAdj != null && pWinnerAdj > pWinner && (
                /* Positive adjustment: translucent extension beyond the solid bar */
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-lime/25 transition-[width] duration-700"
                  style={{ width: `${pWinnerAdj * 100}%` }}
                />
              )}
              {/* Base model bar */}
              <div
                className="relative h-full rounded-full bg-lime transition-[width] duration-500"
                style={{ width: `${pWinner * 100}%` }}
              />
              {pWinnerAdj != null && pWinnerAdj < pWinner && (
                /* Negative adjustment: red zone showing what's lost */
                <div
                  className="absolute inset-y-0 rounded-full bg-red-400/40 transition-all duration-700"
                  style={{
                    left: `${pWinnerAdj * 100}%`,
                    width: `${(pWinner - pWinnerAdj) * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              <span>{winner.name.split(" ").pop()} {(pWinner * 100).toFixed(0)}%</span>
              <span>{(pLoser * 100).toFixed(0)}% {loser.name.split(" ").pop()}</span>
            </div>

            {/* Bookmaker odds */}
            {bookieProbWinner != null && bookieMatch?.oddsA != null && bookieMatch?.oddsB != null && (() => {
              const isSwapped = bookieMatch.playerA === b!.slug;
              const oddsL = isSwapped
                ? (aWins ? bookieMatch.oddsA : bookieMatch.oddsB)
                : (aWins ? bookieMatch.oddsB : bookieMatch.oddsA);
              const bkWinner = Math.round(bookieProbWinner! * 100);
              const bkLoser = Math.round((1 / oddsL) * 100);
              return (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-surface2 px-3 py-2">
                  <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Bookmakers</div>
                  <div className="flex items-baseline gap-3 text-[11px]">
                    <span className="text-muted">{winner.name.split(" ").pop()} <span className="font-mono text-text">{bkWinner}%</span></span>
                    <span className="text-muted/50">·</span>
                    <span className="text-muted"><span className="font-mono text-text">{bkLoser}%</span> {loser.name.split(" ").pop()}</span>
                  </div>
                </div>
              );
            })()}

            {/* Match context: tournament + weather */}
            {bookieMatch && (() => {
              const w = upcomingData.weather?.[bookieMatch.tournament];
              return (
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                  <span className="truncate">
                    {bookieMatch.tournament} · {bookieMatch.surface} · {bookieMatch.date}
                  </span>
                  {w && (
                    <span className="shrink-0 ml-2 font-mono">
                      {Math.round(w.tempMax)}°
                      {w.windMax >= 20 ? ` 💨${Math.round(w.windMax)}` : ""}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ── Smart suggestion ── */}
          {showSuggestion && (
            <div className="rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-[11px] leading-relaxed text-lime">
              {bookieGap > 0 ? (
                <>Les bookmakers donnent <span className="font-semibold text-lime">{winner.name.split(" ").pop()}</span> plus bas ({bookieGap}pts). Blessure ? Fatigue ?</>
              ) : (
                <>Les bookmakers donnent <span className="font-semibold text-lime">{winner.name.split(" ").pop()}</span> plus haut ({Math.abs(bookieGap)}pts). Info en plus ?</>
              )}
            </div>
          )}

          {/* ── Adjustments — collapsible inside the card ── */}
          {canPredict && (
            <div className={
              "rounded-xl border px-4 py-3 transition " +
              (adjOpen
                ? "border-border bg-transparent"
                : "border-lime/20 bg-lime/[0.04] hover:bg-lime/[0.07]")
            }>
              <button
                type="button"
                onClick={() => setAdjOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className={
                    "text-[10px] font-medium uppercase tracking-[0.18em] " +
                    (adjOpen ? "text-muted" : "text-lime/80")
                  }>
                    {adjOpen ? "Ajustements" : "🎯 Ajuste la prédiction"}
                  </span>
                  {adjIds.size > 0 && (
                    <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[10px] font-semibold text-lime">
                      {adjIds.size}
                    </span>
                  )}
                </div>
                <ChevronDown className={
                  "size-4 transition " +
                  (adjOpen ? "rotate-180 text-muted" : "text-lime/60")
                } />
              </button>
              {!adjOpen && adjIds.size === 0 && (
                <p className="mt-1 text-[10px] text-muted/60">
                  Blessure, fatigue, confiance, surface… injecte ce que le modèle ne sait pas.
                </p>
              )}
              {adjOpen && (() => {
                // Build context for smart suggestions inside adjustments.
                const adjCtx: AdjustmentContext = {};
                if (bookieMatch) {
                  const w = upcomingData.weather?.[bookieMatch.tournament];
                  if (w) {
                    adjCtx.tempMax = w.tempMax;
                    adjCtx.windMax = w.windMax;
                    adjCtx.tournament = bookieMatch.tournament;
                  }
                  if (bookieMatch.signals) adjCtx.signals = bookieMatch.signals;
                }
                if (bookieGap !== 0) adjCtx.bookieGapPts = bookieGap;
                return (
                  <div className="mt-3">
                    <Adjustments
                      selected={adjIds}
                      onChange={setAdjIds}
                      playerAName={a!.name}
                      playerBName={b!.name}
                      context={adjCtx}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Waterfall ── */}
          <div className="border-t border-border pt-5">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Pourquoi</div>
            <WaterfallChart
              contributions={result.contributions}
              playerAName={a!.name.split(" ").pop() ?? a!.name}
              playerBName={b!.name.split(" ").pop() ?? b!.name}
            />
          </div>

          {/* ── Details collapsible ── */}
          {trained && (
            <PredictionDetails
              result={result} playerA={a!} playerB={b!}
              surface={surface} model={trained} winnerIsA={aWins}
            />
          )}
        </div>
      )}
    </div>
  );
}
