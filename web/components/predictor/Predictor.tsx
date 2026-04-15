"use client";

import { useState } from "react";
import type { EloRow, ModelBundle, Player, Surface } from "@/lib/types";
import { pickModel, predict } from "@/lib/predict";
import { PlayerSearch } from "./PlayerSearch";
import { SurfacePicker } from "./SurfacePicker";
import { WaterfallChart } from "./WaterfallChart";

export function Predictor({
  players,
  elo,
  model,
}: {
  players: Player[];
  elo: EloRow[];
  model: ModelBundle;
}) {
  const [a, setA] = useState<Player | null>(null);
  const [b, setB] = useState<Player | null>(null);
  const [surface, setSurface] = useState<Surface>("Hard");

  const canPredict = a && b && a.tour === b.tour;
  let result: ReturnType<typeof predict> | null = null;
  if (canPredict) {
    const trained = pickModel(model.models, a!.tour, surface);
    if (trained) result = predict(a!, b!, elo, trained, surface);
  }

  return (
    <div className="space-y-4">
      <PlayerSearch
        players={players}
        value={a}
        onChange={setA}
        placeholder="Joueur·euse A"
        excludeId={b?.id}
      />
      <div className="text-center text-xs uppercase tracking-widest text-muted">vs</div>
      <PlayerSearch
        players={b ? players.filter((p) => !a || p.tour === a.tour) : players}
        value={b}
        onChange={setB}
        placeholder="Joueur·euse B"
        excludeId={a?.id}
      />
      <SurfacePicker value={surface} onChange={setSurface} />

      {a && b && a.tour !== b.tour && (
        <p className="text-sm text-muted">
          Les deux joueurs doivent être du même circuit (ATP ou WTA).
        </p>
      )}

      {result && a && b && (
        <div className="card space-y-5">
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-medium">{a.name}</div>
              <div className="font-serif text-4xl leading-none text-lime">
                {(result.probA * 100).toFixed(0)}%
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
              <div
                className="h-full rounded-full bg-lime transition-[width]"
                style={{ width: `${result.probA * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between text-muted">
              <div className="text-sm">{b.name}</div>
              <div className="font-serif text-2xl leading-none">
                {(result.probB * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-wider text-muted">
              Pourquoi — contribution de chaque facteur
            </div>
            <WaterfallChart
              contributions={result.contributions}
              playerAName={a.name.split(" ").pop() ?? a.name}
              playerBName={b.name.split(" ").pop() ?? b.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
