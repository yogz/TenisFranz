import Link from "next/link";
import type { Player, UpcomingMatch, Surface } from "@/lib/types";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { flag } from "@/lib/format";

const SURFACE_LABEL: Record<Surface, string> = {
  Hard: "Dur",
  Clay: "Terre",
  Grass: "Gazon",
};

function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
  } catch {
    return iso;
  }
}

function ShortName(p: Player | undefined, fallbackSlug: string): {
  label: string;
  flagChar: string;
  photoUrl: string | null;
} {
  if (!p) {
    return { label: fallbackSlug, flagChar: "", photoUrl: null };
  }
  const last = p.lastName ?? p.name;
  const firstInitial = (p.firstName ?? "")[0];
  return {
    label: firstInitial ? `${last}, ${firstInitial}.` : last,
    flagChar: flag(p.countryIso),
    photoUrl: p.photoUrl,
  };
}

export function MatchCard({
  match,
  playerA,
  playerB,
}: {
  match: UpcomingMatch;
  playerA: Player | undefined;
  playerB: Player | undefined;
}) {
  const a = ShortName(playerA, match.playerA);
  const b = ShortName(playerB, match.playerB);
  const aFavorite = match.modelProbA >= 0.5;
  const favPct = Math.round(Math.max(match.modelProbA, 1 - match.modelProbA) * 100);
  const favLabel = aFavorite ? a.label : b.label;

  const href = {
    pathname: "/" as const,
    query: { a: match.playerA, b: match.playerB, s: match.surface },
  };

  const aria = `Prédiction: ${favLabel} favori à ${favPct}% sur ${SURFACE_LABEL[match.surface]}`;

  return (
    <Link
      href={href}
      aria-label={aria}
      className="card card-hover block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
    >
      {/* Row 1 — players + round */}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <PlayerAvatar name={playerA?.name ?? a.label} photoUrl={a.photoUrl} size={32} />
          <span className="truncate text-sm font-medium text-text">
            {a.flagChar && <span className="mr-1">{a.flagChar}</span>}
            {a.label}
          </span>
        </div>
        <div className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
          vs
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-medium text-text">
            {b.label}
            {b.flagChar && <span className="ml-1">{b.flagChar}</span>}
          </span>
          <PlayerAvatar name={playerB?.name ?? b.label} photoUrl={b.photoUrl} size={32} />
        </div>
        <div className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
          {match.round}
        </div>
      </div>

      {/* Row 2 — probability bar */}
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-500"
            style={{
              width: `${favPct}%`,
              marginLeft: aFavorite ? 0 : `${100 - favPct}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span className={aFavorite ? "text-lime" : ""}>
            {Math.round(match.modelProbA * 100)}%
          </span>
          <span className={!aFavorite ? "text-lime" : ""}>
            {Math.round((1 - match.modelProbA) * 100)}%
          </span>
        </div>
      </div>

      {/* Row 3 — meta */}
      <div className="mt-2 truncate text-[11px] text-muted">
        {match.tournament} · {SURFACE_LABEL[match.surface]} · {formatDay(match.date)}
      </div>
    </Link>
  );
}
