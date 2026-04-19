import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchList } from "@/components/matches/MatchList";
import { StalenessBadge } from "@/components/matches/StalenessBadge";
import { loadPlayers, loadUpcoming } from "@/lib/data";
import { SITE_URL, absoluteUrl, jsonLdScript } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Matchs à venir",
  description:
    "Toutes les prédictions des prochains matchs ATP & WTA, mises à jour chaque jour. Probabilité du modèle, surface, tournoi, tour. Ouvre n'importe quelle carte pour simuler des ajustements.",
  alternates: { canonical: "/matches" },
  openGraph: {
    url: "/matches",
    title: "Matchs à venir — prédictions ATP & WTA",
    description:
      "Prédictions des prochains matchs ATP & WTA, mises à jour chaque jour.",
  },
};

export default async function MatchesPage() {
  const [upcoming, players] = await Promise.all([loadUpcoming(), loadPlayers()]);
  const playerById = new Map(players.map((p) => [p.id, p]));

  const sportsEvents = upcoming.matches.slice(0, 50).map((m) => {
    const pA = playerById.get(`${m.tour}-${m.playerA}`);
    const pB = playerById.get(`${m.tour}-${m.playerB}`);
    return {
      "@type": "SportsEvent" as const,
      "@id": `${SITE_URL}/matches#${m.id}`,
      name: `${pA?.name ?? m.playerA} vs ${pB?.name ?? m.playerB}`,
      startDate: m.date,
      sport: m.tour === "atp" ? "Tennis ATP" : "Tennis WTA",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: m.tournament,
      },
      competitor: [
        {
          "@type": "SportsTeam",
          name: pA?.name ?? m.playerA,
          url: pA ? absoluteUrl(`/players/${pA.slug}`) : undefined,
        },
        {
          "@type": "SportsTeam",
          name: pB?.name ?? m.playerB,
          url: pB ? absoluteUrl(`/players/${pB.slug}`) : undefined,
        },
      ],
      // Non-schema keys are stripped by search engines but documented for LLMs.
      description: `${m.tournament} · ${m.round} · ${m.surface}. Prédiction du modèle TenisFranz : ${(m.modelProbA * 100).toFixed(0)}% pour ${pA?.name ?? m.playerA}.`,
    };
  });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/matches#list`,
    name: "Matchs ATP & WTA à venir",
    description:
      "Liste des prochains matchs ATP & WTA avec la probabilité prédite par TenisFranz.",
    numberOfItems: sportsEvents.length,
    itemListElement: sportsEvents.map((event, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: event,
    })),
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(itemListJsonLd)}
      />
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl">Matchs à venir</h1>
          <StalenessBadge updatedAt={upcoming.updatedAt} />
        </div>
        <p className="max-w-sm text-[14px] leading-relaxed text-muted">
          Chaque carte est une prédiction du modèle. Touche-la pour ouvrir
          le prédicteur avec les joueurs, le surface et tester tes propres
          ajustements.
        </p>
      </header>

      <Suspense fallback={null}>
        <MatchList matches={upcoming.matches} players={players} weather={upcoming.weather} />
      </Suspense>
    </div>
  );
}
