import { Suspense } from "react";
import { Predictor } from "@/components/predictor/Predictor";
import { loadElo, loadMeta, loadModel, loadPlayers } from "@/lib/data";

export default async function HomePage() {
  const [players, elo, model, meta] = await Promise.all([
    loadPlayers(),
    loadElo(),
    loadModel(),
    loadMeta(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="chip">
          <span className="size-1.5 rounded-full bg-lime" />
          Modèle entraîné sur {meta.yearFrom || "2005"}–{meta.yearTo || "2025"}
        </div>
        <h1 className="font-display text-[44px] font-light leading-[0.95] tracking-tight">
          Qui va gagner&nbsp;?
        </h1>
        <p className="max-w-sm text-[15px] leading-relaxed text-muted">
          Sélectionne deux joueurs, une surface. Le modèle te donne une probabilité — et pourquoi.
        </p>
      </header>
      {players.length === 0 ? (
        <div className="card">
          <p className="text-sm text-muted">
            Les données ne sont pas encore générées. Lance le pipeline&nbsp;:
          </p>
          <pre className="mt-2 overflow-auto rounded-lg bg-surface2 p-3 text-xs">
            cd pipeline{"\n"}uv sync{"\n"}uv run python -m tenisfranz.run_all --years 2018-2024
          </pre>
        </div>
      ) : (
        <Suspense fallback={null}>
          <Predictor players={players} elo={elo} model={model} />
        </Suspense>
      )}
    </div>
  );
}
