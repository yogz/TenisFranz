import { notFound } from "next/navigation";
import Image from "next/image";
import { Info } from "lucide-react";
import { loadH2h, loadPlayers, loadPlayersIndex } from "@/lib/data";
// loadPlayers is only used in generateStaticParams (runs once);
// the page itself uses loadPlayersIndex for O(1) slug lookups.
import { H2HBlock } from "@/components/profile/H2HBlock";
import type { Surface } from "@/lib/types";
import { flag, formatDate, formatHeight, handLabel } from "@/lib/format";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerNavSearch } from "@/components/PlayerNavSearch";

const SURFACE_LABEL: Record<Surface, string> = {
  Hard: "Hard",
  Clay: "Clay",
  Grass: "Grass",
};

export async function generateStaticParams() {
  const players = await loadPlayers();
  // Only pre-render pages for players active in the last 2 years.
  // Inactive players (retired, dropped off tour) still have a profile if
  // accessed by direct URL — Next.js will 404 on the static export, but
  // that's acceptable: nobody is searching for a player whose last match
  // was in 2012. This cuts the build from ~4100 pages / 13 GB output
  // down to ~800 pages / ~200 MB — comfortably within Vercel's disk limit.
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // yyyy-mm-dd
  return players
    .filter((p) => p.career?.lastMatchDate && p.career.lastMatchDate >= cutoffStr)
    .map((p) => ({ slug: p.slug }));
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Use the shared players index so the bySlug / byId Maps and the
  // per-tour filters are built once per build, not once per page.
  const [index, h2h] = await Promise.all([loadPlayersIndex(), loadH2h()]);
  const player = index.bySlug.get(slug);
  if (!player) notFound();
  const playersById = index.byId;
  const h2hEntries = h2h[player.id] ?? [];

  const surfaces: Surface[] = ["Hard", "Clay", "Grass"];
  const career = player.career;
  const bestSurface = surfaces.reduce((a, b) =>
    player.currentEloSurface[a] >= player.currentEloSurface[b] ? a : b,
  );
  const totalMatches = surfaces.reduce((sum, s) => sum + (player.matchesBySurface[s] ?? 0), 0);
  const bestEloNow = Math.max(...surfaces.map((s) => player.currentEloSurface[s]));
  const bestEloPeak = Math.max(...surfaces.map((s) => career.peakEloSurface[s]));

  return (
    <div className="space-y-6">
      <PlayerNavSearch tour={player.tour} excludeId={player.id} />

      {/* Hero with photo */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        {player.photoUrl && (
          <div className="absolute inset-0 -z-0 opacity-25 blur-2xl">
            <Image
              src={player.photoUrl}
              alt=""
              fill
              unoptimized
              sizes="640px"
              className="object-cover"
            />
          </div>
        )}
        <div className="relative z-10 flex items-center gap-4 p-5">
          <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={96} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="chip">
              {player.tour.toUpperCase()} · #{player.rank}
            </div>
            <h1 className="font-display text-[32px] font-light leading-[1.05] tracking-tight">
              {player.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              {player.countryIso && (
                <span className="text-base leading-none">{flag(player.countryIso)}</span>
              )}
              {player.country && <span>{player.country}</span>}
              {player.age != null && <span>· {player.age.toFixed(0)} ans</span>}
              {player.hand && <span>· {handLabel(player.hand)}</span>}
              {player.heightCm && <span>· {formatHeight(player.heightCm)}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Career headline */}
      <section className="grid grid-cols-3 gap-3">
        <HeadlineStat label="Victoires" value={career.wins.toString()} />
        <HeadlineStat label="Win %" value={`${(career.winPct * 100).toFixed(0)}%`} />
        <HeadlineStat label="Titres" value={career.titles.toString()} />
      </section>

      {/* Secondary stats */}
      <section className="card grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Matchs
          </div>
          <div className="mt-1 font-mono text-xl text-text">{totalMatches}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Défaites
          </div>
          <div className="mt-1 font-mono text-xl text-text">{career.losses}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Elo peak
          </div>
          <div className="mt-1 font-mono text-xl text-text">{Math.round(bestEloPeak)}</div>
          <div className="text-[10px] text-muted">actuel {Math.round(bestEloNow)}</div>
        </div>
      </section>

      {/* Recent form + last 3 matches (merged) */}
      <section className="card space-y-4">
        <div className="flex items-baseline justify-between">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Forme récente
          </div>
          <div className="text-xs text-muted">
            {career.last10.filter((r) => r === "W").length}-
            {career.last10.filter((r) => r === "L").length}
          </div>
        </div>
        <div className="flex gap-1.5">
          {career.last10.length === 0 ? (
            <div className="text-xs text-muted">—</div>
          ) : (
            career.last10.map((r, i) => (
              <div
                key={i}
                className={
                  "flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold " +
                  (r === "W" ? "bg-lime text-black" : "bg-surface2 text-muted")
                }
              >
                {r === "W" ? "V" : "D"}
              </div>
            ))
          )}
        </div>

        {/* Detailed last matches inline */}
        {career.recentMatches && career.recentMatches.length > 0 && (<>
          <div className="h-px bg-border" />
          <ul className="space-y-2">
            {[...career.recentMatches].reverse().map((m, i) => {
              const opSlug = playersById.get(`${player.tour}-${m.opponentId}`)?.slug;
              return (
                <li key={i} className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2">
                  <div
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold " +
                      (m.won ? "bg-lime text-black" : "bg-red-400/20 text-red-300")
                    }
                  >
                    {m.won ? "V" : "D"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-muted">vs</span>
                      {opSlug ? (
                        <a
                          href={`/players/${opSlug}`}
                          className="truncate text-sm font-medium text-text hover:text-lime"
                        >
                          {m.opponent}
                        </a>
                      ) : (
                        <span className="truncate text-sm font-medium text-text">{m.opponent}</span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-muted">
                      {m.tournament} · {m.round} · {SURFACE_LABEL[m.surface as Surface] ?? m.surface}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs text-text">{m.score || "—"}</div>
                    <div className="text-[10px] text-muted">{formatDate(m.date)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>)}
      </section>

      {/* Elo per surface */}
      <section className="card space-y-3">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Elo par surface
            <Info className="size-3 opacity-70 transition group-open:text-lime" />
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            L&apos;<span className="text-text">Elo</span> est un score qui mesure le niveau d&apos;un
            joueur d&apos;après ses résultats. Battre un adversaire mieux classé fait grimper le
            score&nbsp;; perdre contre un moins bien classé le fait baisser. On calcule un Elo
            séparé par surface car les styles (terre lente, gazon rapide) récompensent des qualités
            différentes. Repères&nbsp;: ~2000 = top 10 mondial, ~1800 = top 50, ~1500 = débutant sur
            le circuit.
          </p>
        </details>
        <div className="grid grid-cols-3 gap-3">
          {surfaces.map((s) => {
            const current = player.currentEloSurface[s];
            const peak = career.peakEloSurface[s];
            const matches = player.matchesBySurface[s] ?? 0;
            const isBest = s === bestSurface;
            return (
              <div
                key={s}
                className={
                  "rounded-xl bg-surface2 p-3 text-center " +
                  (isBest ? "ring-1 ring-lime/40" : "")
                }
              >
                <div className="text-[11px] uppercase tracking-wider text-muted">
                  {SURFACE_LABEL[s]}
                </div>
                <div className="font-mono text-2xl text-text">{Math.round(current)}</div>
                <div className="mt-1 text-[10px] text-muted">peak {Math.round(peak)}</div>
                <div className="text-[10px] text-muted">{matches} matchs</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* By-surface W-L bars */}
      <section className="card space-y-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          Bilan par surface
        </div>
        <ul className="space-y-3">
          {surfaces.map((s) => {
            const row = career.bySurface[s];
            const total = row.wins + row.losses;
            const pct = total ? (row.winPct * 100).toFixed(0) : "—";
            return (
              <li key={s} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">{SURFACE_LABEL[s]}</span>
                  <span className="font-mono text-text">
                    {row.wins}-{row.losses}{" "}
                    <span className="text-muted">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full bg-lime"
                    style={{ width: `${row.winPct * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* H2H — collapsed by default, positioned right after "Bilan par surface" */}
      <H2HBlock player={player} entries={h2hEntries} playersById={playersById} />

      {/* Titles */}
      {career.lastTournaments.length > 0 && (
        <section className="card space-y-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Titres récents
          </div>
          <ul className="flex flex-wrap gap-2">
            {career.lastTournaments.map((t, i) => (
              <li key={`${t}-${i}`} className="chip text-text">
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Identity */}
      <section className="card space-y-2 text-sm">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          Identité
        </div>
        <dl className="space-y-1">
          {player.dob && <Row label="Date de naissance" value={formatDate(player.dob)} />}
          {player.country && (
            <Row
              label="Nationalité"
              value={`${flag(player.countryIso)} ${player.country}`.trim()}
            />
          )}
          {player.hand && <Row label="Main" value={handLabel(player.hand)} />}
          {player.heightCm && <Row label="Taille" value={formatHeight(player.heightCm)} />}
          {player.wikidataId && (
            <Row
              label="Wikidata"
              value={
                <a
                  href={`https://www.wikidata.org/wiki/${player.wikidataId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lime hover:underline"
                >
                  {player.wikidataId}
                </a>
              }
            />
          )}
        </dl>
      </section>
    </div>
  );
}

function HeadlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-3xl text-text">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  );
}
