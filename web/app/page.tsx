import { Predictor } from "@/components/predictor/Predictor";
import { loadElo, loadModel, loadPlayers } from "@/lib/data";

export default async function HomePage() {
  const [players, elo, model] = await Promise.all([loadPlayers(), loadElo(), loadModel()]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-4xl leading-none">Qui va gagner ?</h1>
        <p className="text-sm text-muted">
          Sélectionne deux joueurs, une surface. Le modèle te donne une probabilité — et pourquoi.
        </p>
      </header>
      {players.length === 0 ? (
        <div className="card">
          <p className="text-sm text-muted">
            Les données ne sont pas encore générées. Lance le pipeline :
          </p>
          <pre className="mt-2 overflow-auto rounded-lg bg-surface2 p-3 text-xs">
            cd pipeline{"\n"}uv sync{"\n"}uv run python -m tenisfranz.run_all --years 2018-2024
          </pre>
        </div>
      ) : (
        <Predictor players={players} elo={elo} model={model} />
      )}
    </div>
  );
}
