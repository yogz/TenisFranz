import { notFound } from "next/navigation";
import Image from "next/image";
import { loadPlayers } from "@/lib/data";
import type { Surface } from "@/lib/types";
import { flag, formatDate, formatHeight, handLabel } from "@/lib/format";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const SURFACE_LABEL: Record<Surface, string> = {
  Hard: "Dur",
  Clay: "Terre",
  Grass: "Gazon",
};

export async function generateStaticParams() {
  const players = await loadPlayers();
  return players.map((p) => ({ slug: p.slug }));
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const players = await loadPlayers();
  const player = players.find((p) => p.slug === slug);
  if (!player) notFound();

  const surfaces: Surface[] = ["Hard", "Clay", "Grass"];
  const career = player.career;
  const bestSurface = surfaces.reduce((a, b) =>
    player.currentEloSurface[a] >= player.currentEloSurface[b] ? a : b,
  );

  return (
    <div className="space-y-6">
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

      {/* Recent form */}
      <section className="card space-y-3">
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
                {r}
              </div>
            ))
          )}
        </div>
        {career.lastMatchDate && (
          <div className="text-[11px] text-muted">
            Dernier match : {formatDate(career.lastMatchDate)}
          </div>
        )}
      </section>

      {/* Elo per surface */}
      <section className="card space-y-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          Elo par surface
        </div>
        <div className="grid grid-cols-3 gap-3">
          {surfaces.map((s) => {
            const current = player.currentEloSurface[s];
            const peak = career.peakEloSurface[s];
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
                <div className="font-display text-2xl text-text">{Math.round(current)}</div>
                <div className="mt-1 text-[10px] text-muted">peak {Math.round(peak)}</div>
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
      <div className="mt-1 font-display text-3xl text-text">{value}</div>
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
