import Link from "next/link";
import { loadPlayers } from "@/lib/data";

export default async function PlayersPage() {
  const players = await loadPlayers();
  const atp = players.filter((p) => p.tour === "atp").slice(0, 100);
  const wta = players.filter((p) => p.tour === "wta").slice(0, 100);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-3xl">Joueurs</h1>
        <p className="text-sm text-muted">Top 100 par Elo — ATP & WTA</p>
      </header>

      {[
        { title: "ATP", list: atp },
        { title: "WTA", list: wta },
      ].map(({ title, list }) => (
        <section key={title}>
          <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">{title}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {list.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-right font-mono text-xs text-muted">#{p.rank}</div>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted">{p.country ?? "—"}</div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
