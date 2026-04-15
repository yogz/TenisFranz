import { notFound } from "next/navigation";
import { loadElo, loadPlayers } from "@/lib/data";
import type { Surface } from "@/lib/types";

export async function generateStaticParams() {
  const players = await loadPlayers();
  return players.map((p) => ({ slug: p.slug }));
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [players, elo] = await Promise.all([loadPlayers(), loadElo()]);
  const player = players.find((p) => p.slug === slug);
  if (!player) notFound();

  const elos = elo.filter((e) => e.id === player.id);
  const surfaces: Surface[] = ["Hard", "Clay", "Grass"];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="chip">{player.tour.toUpperCase()} · #{player.rank}</div>
        <h1 className="font-display text-4xl leading-tight">{player.name}</h1>
        <p className="text-sm text-muted">
          {player.country ?? "—"} {player.age ? `· ${player.age.toFixed(0)} ans` : ""}
        </p>
      </header>

      <section className="card">
        <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">Elo par surface</h2>
        <div className="grid grid-cols-3 gap-3">
          {surfaces.map((s) => {
            const row = elos.find((e) => e.surface === s);
            const label = s === "Hard" ? "Dur" : s === "Clay" ? "Terre" : "Gazon";
            return (
              <div key={s} className="rounded-xl bg-surface2 p-3 text-center">
                <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
                <div className="font-display text-2xl text-text">
                  {row ? Math.round(row.elo) : "—"}
                </div>
                <div className="text-[11px] text-muted">{row ? `${row.matches} matchs` : ""}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
