import { Suspense } from "react";
import { MatchList } from "@/components/matches/MatchList";
import { StalenessBadge } from "@/components/matches/StalenessBadge";
import { loadPlayers, loadUpcoming } from "@/lib/data";

export default async function MatchesPage() {
  const [upcoming, players] = await Promise.all([loadUpcoming(), loadPlayers()]);

  return (
    <div className="space-y-6">
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
        <MatchList matches={upcoming.matches} players={players} />
      </Suspense>
    </div>
  );
}
