import Link from "next/link";
import type { H2HEntry, Player, Surface } from "@/lib/types";

const SURFACE_LABEL: Record<Surface, string> = {
  Hard: "Hard",
  Clay: "Clay",
  Grass: "Grass",
};

function winPct(e: H2HEntry): number {
  const total = e.wins + e.losses;
  return total > 0 ? e.wins / total : 0;
}

export function H2HBlock({
  player,
  entries,
  playersById,
}: {
  player: Player;
  entries: H2HEntry[];
  playersById: Map<string, Player>;
}) {
  if (!entries || entries.length === 0) return null;

  const withMeta = entries
    .map((e) => ({ e, pct: winPct(e), opp: playersById.get(e.opponent) }))
    .filter((row) => row.opp !== undefined);

  const sufficient = withMeta.filter((r) => r.e.wins + r.e.losses >= 3);
  const favori =
    sufficient.length > 0
      ? [...sufficient].sort((a, b) => b.pct - a.pct)[0]
      : null;
  const beteNoire =
    sufficient.length > 0
      ? [...sufficient].sort((a, b) => a.pct - b.pct)[0]
      : null;

  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Adversaires
          </div>
          <div className="mt-1 text-sm text-text">
            {withMeta.length} face-à-face
          </div>
        </div>
        <svg
          className="size-4 text-muted transition-transform group-open:rotate-180"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
        </svg>
      </summary>

      <div className="mt-5 space-y-5">
        {(favori || beteNoire) && (
          <div className="grid grid-cols-2 gap-3">
            {favori && (
              <Highlight
                title="Adversaire favori"
                entry={favori.e}
                opp={favori.opp!}
                player={player}
              />
            )}
            {beteNoire && beteNoire.opp!.id !== favori?.opp?.id && (
              <Highlight
                title="Bête noire"
                entry={beteNoire.e}
                opp={beteNoire.opp!}
                player={player}
                negative
              />
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Top rivalries
          </div>
          <ul className="divide-y divide-border">
            {withMeta.map(({ e, opp }) => {
              const pct = Math.round(winPct(e) * 100);
              return (
                <li key={e.opponent}>
                  <Link
                    href={{
                      pathname: "/",
                      query: { a: player.slug, b: opp!.slug, s: e.bestSurface },
                    }}
                    className="flex items-center justify-between gap-3 py-2 hover:bg-surface2/40"
                  >
                    <div className="min-w-0 flex-1 truncate text-sm text-text">
                      {opp!.name}
                    </div>
                    <div className="shrink-0 text-[11px] text-muted">
                      {SURFACE_LABEL[e.bestSurface]}
                    </div>
                    <div className="shrink-0 font-mono text-sm text-text">
                      {e.wins}–{e.losses}
                    </div>
                    <div className="w-10 shrink-0 text-right font-mono text-[11px] text-muted">
                      {pct}%
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </details>
  );
}

function Highlight({
  title,
  entry,
  opp,
  player,
  negative,
}: {
  title: string;
  entry: H2HEntry;
  opp: Player;
  player: Player;
  negative?: boolean;
}) {
  const pct = Math.round(winPct(entry) * 100);
  return (
    <Link
      href={{
        pathname: "/",
        query: { a: player.slug, b: opp.slug, s: entry.bestSurface },
      }}
      className="rounded-xl bg-surface2 p-3 hover:bg-surface2/80"
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {title}
      </div>
      <div className="mt-1 truncate text-sm font-medium text-text">{opp.name}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-sm text-text">
          {entry.wins}–{entry.losses}
        </span>
        <span
          className={
            "font-mono text-[11px] " + (negative ? "text-red-400" : "text-lime")
          }
        >
          {pct}%
        </span>
      </div>
    </Link>
  );
}
