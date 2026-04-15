"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { PredictionResult } from "@/lib/predict";
import type { Player, Surface, TrainedModel } from "@/lib/types";

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// Human-friendly explanation of each feature used by the model.
const FEATURE_HELP: Record<string, string> = {
  elo_surface_diff:
    "Écart d'Elo spécifique à la surface. C'est le signal le plus fort : il capture la hiérarchie entre les joueurs d'après leurs résultats passés sur cette surface.",
  serve_pts_won_diff:
    "Différence de % de points gagnés au service sur les 12 derniers mois. Un gros serveur sur une surface rapide prend un bonus ici.",
  return_pts_won_diff:
    "Différence de % de points gagnés en retour. Les terriens qui poussent long en fond de court dominent cette colonne.",
  form_diff:
    "Forme récente (résultats sur les ~10 derniers matchs, pondérés par la qualité de l'adversaire).",
  h2h_diff:
    "Historique direct entre les deux joueurs, lissé en Bayésien pour éviter les petits échantillons.",
  fatigue_diff:
    "Charge physique récente : matchs longs, nombre de sets joués sur les derniers jours.",
  age_diff: "Écart d'âge brut — jeunesse vs expérience.",
  age_sq_diff:
    "Terme quadratique de l'âge : capture la courbe en cloche (pic vers 25-27 ans, puis déclin).",
  tourney_weight:
    "Importance du tournoi (Grand Chelem > Masters > ATP 500…). Réduit l'incertitude sur les gros événements.",
};

function formatContribImpact(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function PredictionDetails({
  result,
  playerA,
  playerB,
  surface,
  model,
  winnerIsA,
}: {
  result: PredictionResult;
  playerA: Player;
  playerB: Player;
  surface: Surface;
  model: TrainedModel;
  winnerIsA: boolean;
}) {
  const [open, setOpen] = useState(false);

  const winner = winnerIsA ? playerA : playerB;
  const loser = winnerIsA ? playerB : playerA;
  const shortWinner = winner.name.split(" ").pop() ?? winner.name;
  const shortLoser = loser.name.split(" ").pop() ?? loser.name;
  const shortA = playerA.name.split(" ").pop() ?? playerA.name;
  const shortB = playerB.name.split(" ").pop() ?? playerB.name;

  const eloA = playerA.currentEloSurface?.[surface] ?? 1500;
  const eloB = playerB.currentEloSurface?.[surface] ?? 1500;
  const matchesA = playerA.matchesBySurface?.[surface] ?? 0;
  const matchesB = playerB.matchesBySurface?.[surface] ?? 0;

  const probWinner = winnerIsA ? result.probA : result.probB;
  const logitFavoringWinner = winnerIsA ? result.logit : -result.logit;

  // Probability if the only input were the model intercept (i.e. strip all signals).
  const baseline = sigmoid(model.intercept);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Détail
          </span>
          <span className="text-[11px] text-muted/80">
            {open ? "Masquer l'analyse" : "Comment on arrive à ce score ?"}
          </span>
        </div>
        <ChevronDown
          className={"size-4 text-muted transition " + (open ? "rotate-180" : "")}
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-border px-4 py-4 text-[12px] leading-relaxed text-muted">
          {/* 1. How the model works */}
          <section className="space-y-1.5">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text">
              Comment ça marche&nbsp;?
            </h4>
            <p>
              Une régression logistique entraînée sur{" "}
              <span className="text-text">{model.nTrain.toLocaleString("fr-FR")}</span>{" "}
              matchs {model.tour.toUpperCase()} joués sur {surface.toLowerCase()}. Pour chaque
              rencontre, on calcule la différence de {model.featureNames.length - 1} indicateurs
              entre les deux joueurs, on multiplie par les coefficients appris, puis on passe le
              tout dans une sigmoïde pour obtenir une probabilité entre 0 et 100 %.
            </p>
          </section>

          {/* 2. Raw data */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text">
              Les données clés
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: shortA, elo: eloA, matches: matchesA, age: playerA.age },
                { name: shortB, elo: eloB, matches: matchesB, age: playerB.age },
              ].map((p) => (
                <div
                  key={p.name}
                  className="space-y-1 rounded-lg bg-surface2 px-3 py-2"
                >
                  <div className="truncate text-[11px] font-medium text-text">
                    {p.name}
                  </div>
                  <div className="flex justify-between">
                    <span>Elo {surface.toLowerCase()}</span>
                    <span className="font-mono text-text">{Math.round(p.elo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matchs surface</span>
                    <span className="font-mono text-text">{p.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Âge</span>
                    <span className="font-mono text-text">
                      {p.age != null ? p.age.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted/80">
              L'écart d'Elo sur cette surface (
              <span className="font-mono text-text">
                {eloA >= eloB ? "+" : ""}
                {Math.round(eloA - eloB)}
              </span>{" "}
              en faveur de {eloA >= eloB ? shortA : shortB}) pèse généralement le plus dans le
              score.
            </p>
          </section>

          {/* 3. Per-feature breakdown */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text">
              Détail des facteurs
            </h4>
            <p className="text-[11px] text-muted/80">
              Chaque ligne montre comment ce facteur déplace le logit (l'échelle interne du
              modèle). Une valeur positive favorise {shortA}, une valeur négative favorise{" "}
              {shortB}.
            </p>
            <ul className="space-y-2">
              {result.contributions.map((c) => {
                const favors =
                  Math.abs(c.value) < 1e-6
                    ? "neutre"
                    : c.value > 0
                    ? shortA
                    : shortB;
                const help = FEATURE_HELP[c.name];
                return (
                  <li
                    key={c.name}
                    className="rounded-lg bg-surface2 px-3 py-2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[12px] font-medium text-text">
                        {c.label}
                      </div>
                      <div className="shrink-0 font-mono text-[11px] text-text">
                        {formatContribImpact(c.value)}
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="text-muted/80">
                        Favorise{" "}
                        <span
                          className={
                            favors === "neutre"
                              ? "text-muted"
                              : "text-text"
                          }
                        >
                          {favors}
                        </span>
                      </span>
                    </div>
                    {help && (
                      <p className="mt-1 text-[11px] leading-relaxed text-muted/80">
                        {help}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 4. The math */}
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.18em] text-text">
              Le calcul
            </h4>
            <div className="space-y-1 rounded-lg bg-surface2 px-3 py-2 font-mono text-[11px] text-text">
              <div className="flex justify-between">
                <span className="text-muted">biais du modèle</span>
                <span>{model.intercept.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">+ somme des facteurs</span>
                <span>{(result.logit - model.intercept).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className="text-muted">= logit</span>
                <span>{result.logit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">
                  sigmoïde → P({shortA})
                </span>
                <span>{(result.probA * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted/80">
              Sans aucun signal, le modèle partirait d'une base de{" "}
              <span className="font-mono text-text">
                {(baseline * 100).toFixed(0)}%
              </span>
              . Après avoir additionné tous les facteurs, il monte à{" "}
              <span className="font-mono text-text">
                {(probWinner * 100).toFixed(0)}%
              </span>{" "}
              pour <span className="text-text">{shortWinner}</span>, soit{" "}
              <span className="font-mono text-text">
                {logitFavoringWinner >= 0 ? "+" : ""}
                {logitFavoringWinner.toFixed(2)}
              </span>{" "}
              de logit en sa faveur contre {shortLoser}.
            </p>
          </section>

          <p className="text-[11px] leading-relaxed text-muted/70">
            ⚠️ Le modèle s'appuie surtout sur l'Elo par surface et l'âge ; les autres
            variables (% service/retour, face-à-face) utilisent des valeurs moyennes
            côté front faute de données live. Pour injecter du contexte (blessure,
            fatigue, confiance…), utilise les{" "}
            <span className="text-text">ajustements</span> au-dessus : ils décalent
            directement la probabilité finale d'une quantité calibrée à la main, et
            leur direction est toujours garantie correcte.
          </p>
        </div>
      )}
    </div>
  );
}
