import type { Metadata } from "next";
import Link from "next/link";
import { loadPlayers } from "@/lib/data";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { flag } from "@/lib/format";
import { SITE_URL, absoluteUrl, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Top 100 joueurs ATP & WTA",
  description:
    "Les 100 meilleurs joueurs ATP et les 100 meilleures joueuses WTA, classés par Elo. Rang, pays, âge, Elo courant — accès direct à chaque fiche joueur.",
  alternates: { canonical: "/players" },
  openGraph: {
    url: "/players",
    title: "Top 100 joueurs ATP & WTA — TenisFranz",
    description:
      "Top 100 ATP et WTA classés par Elo. Rang, pays, âge, Elo courant.",
  },
};

export default async function PlayersPage() {
  const players = await loadPlayers();
  const atp = players.filter((p) => p.tour === "atp").slice(0, 100);
  const wta = players.filter((p) => p.tour === "wta").slice(0, 100);

  const buildList = (list: typeof players, tourLabel: string) => ({
    "@type": "ItemList" as const,
    name: `Top 100 ${tourLabel}`,
    numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/players/${p.slug}`),
      name: p.name,
    })),
  });

  const directoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/players#collection`,
    url: absoluteUrl("/players"),
    name: "Top 100 joueurs ATP & WTA",
    inLanguage: "fr",
    hasPart: [buildList(atp, "ATP"), buildList(wta, "WTA")],
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(directoryJsonLd)}
      />
      <header className="space-y-1">
        <h1 className="font-display text-[32px] font-light leading-none tracking-tight">
          Joueurs
        </h1>
        <p className="text-sm text-muted">Top 100 par Elo — ATP & WTA</p>
      </header>

      {[
        { title: "ATP", list: atp },
        { title: "WTA", list: wta },
      ].map(({ title, list }) => (
        <section key={title}>
          <h2 className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            {title}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {list.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/players/${p.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface2"
                >
                  <div className="w-6 shrink-0 text-right font-mono text-xs text-muted">
                    {p.rank}
                  </div>
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.countryIso && <span>{flag(p.countryIso)} </span>}
                      {p.country ?? "—"}
                      {p.age != null && <span> · {p.age.toFixed(0)} ans</span>}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-muted">
                    {Math.round(Math.max(...Object.values(p.currentEloSurface)))}
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
