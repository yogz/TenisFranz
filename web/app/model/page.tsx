import {
  loadBacktest,
  loadMeta,
  loadModel,
  loadUpcoming,
} from "@/lib/data";
import { CalibrationChart } from "@/components/charts/CalibrationChart";
import { AccuracyOverTime } from "@/components/charts/AccuracyOverTime";
import { Hint } from "@/components/Hint";

export default async function ModelPage() {
  const [backtest, meta, model, upcoming] = await Promise.all([
    loadBacktest(),
    loadMeta(),
    loadModel(),
    loadUpcoming(),
  ]);
  const tours = Object.keys(backtest) as Array<keyof typeof backtest>;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-display text-3xl">Modèle</h1>
        <p className="text-sm text-muted">
          Régression logistique
          <Hint
            align="start"
            text="Modèle statistique simple qui combine plusieurs caractéristiques (forme, classement, surface, confrontations directes…) pour estimer la probabilité qu'un joueur batte l'autre. Il sort un nombre entre 0 et 1."
          />{" "}
          · {meta.yearFrom}-{meta.yearTo} · entraîné le{" "}
          {meta.trainedAt ? new Date(meta.trainedAt).toLocaleDateString("fr-FR") : "—"}
        </p>
      </header>

      {tours.length === 0 && (
        <div className="card text-sm text-muted">
          Aucun backtest disponible — lance le pipeline pour générer les métriques.
        </div>
      )}

      {/* Performance hero */}
      {tours.length > 0 && (() => {
        const totalN = tours.reduce((s, t) => s + backtest[t].nTest, 0);
        const avgAcc = tours.reduce((s, t) => s + backtest[t].accuracy * backtest[t].nTest, 0) / totalN;
        return (
          <section className="card space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="Précision"
                hint="Pourcentage de matchs où le modèle a correctement désigné le vainqueur."
                value={`${(avgAcc * 100).toFixed(1)}%`}
              />
              <Stat
                label="Matchs testés"
                hint="Nombre de matchs utilisés pour évaluer le modèle en walk-forward (le modèle n'a jamais vu ces matchs pendant l'entraînement)."
                value={totalN.toLocaleString("fr-FR")}
              />
              <Stat
                label="Depuis"
                value={`${meta.yearFrom}`}
              />
            </div>
            <div className="rounded-lg bg-surface2 px-3 py-2 text-[11px] leading-relaxed text-muted">
              Le modèle identifie correctement le vainqueur dans{" "}
              <span className="text-text">2 matchs sur 3</span>.
              Il combine Elo par surface, stats de service/retour, face-à-face
              et âge pour estimer une probabilité — pas un conseil de pari.
            </div>
          </section>
        );
      })()}

      {tours.map((tour) => {
        const m = backtest[tour];
        return (
          <section key={tour} className="space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted">{tour.toUpperCase()}</h2>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Précision"
                hint="Pourcentage de matchs où le modèle a désigné le bon vainqueur (probabilité ≥ 50 %). Un coup de pile-ou-face donnerait 50 %."
                value={`${(m.accuracy * 100).toFixed(1)}%`}
              />
              <Stat
                label="Log loss"
                hint="Pénalise les prédictions trop sûres qui se trompent. Plus c'est bas, mieux c'est. 0,693 correspond à un modèle aléatoire."
                value={m.logLoss.toFixed(3)}
              />
              <Stat
                label="Brier"
                hint="Erreur quadratique moyenne entre la probabilité prédite et le résultat réel (0 ou 1). Plus c'est bas, mieux c'est ; 0,25 = modèle aléatoire."
                value={m.brier.toFixed(3)}
              />
            </div>
            <div className="card">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted">
                Précision par an
                <Hint
                  align="start"
                  text="Évolution de la précision année par année. Permet de repérer une éventuelle dérive : un modèle qui se dégrade dans le temps doit être réentraîné."
                />
              </div>
              <AccuracyOverTime data={m.byYear} />
            </div>
            <div className="card">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted">
                Calibration
                <Hint
                  align="start"
                  text="Compare la probabilité annoncée à la fréquence réelle observée. Un modèle bien calibré : quand il dit 70 %, le joueur gagne 7 fois sur 10. La courbe doit longer la diagonale."
                />
              </div>
              <CalibrationChart data={m.calibration} />
            </div>
          </section>
        );
      })}

      {/* Health dashboard */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted">
          Santé de la plateforme
        </h2>
        <div className="card space-y-2">
          <HealthRow
            label="Modèle"
            detail={meta.trainedAt
              ? `Entraîné le ${new Date(meta.trainedAt).toLocaleDateString("fr-FR")} · ${meta.yearFrom}-${meta.yearTo}`
              : "Non entraîné"}
            ok={!!meta.trainedAt && daysSince(meta.trainedAt) < 3}
            warn={!!meta.trainedAt && daysSince(meta.trainedAt) >= 3 && daysSince(meta.trainedAt) < 7}
          />
          <HealthRow
            label="Matchs upcoming"
            detail={`${upcoming.matches.length} matchs · mis à jour ${timeAgo(upcoming.updatedAt)}`}
            ok={upcoming.matches.length > 0 && daysSince(upcoming.updatedAt) < 2}
            warn={daysSince(upcoming.updatedAt) >= 2 && daysSince(upcoming.updatedAt) < 4}
          />
          <HealthRow
            label="Odds API"
            detail={upcoming.matches.some((m) => m.oddsA != null)
              ? `${upcoming.matches.filter((m) => m.oddsA != null).length} matchs avec cotes`
              : "Pas de cotes disponibles"}
            ok={upcoming.matches.some((m) => m.oddsA != null)}
          />
          <HealthRow
            label="Pipeline"
            detail={meta.trainedAt
              ? `Données ${meta.yearFrom}-${meta.yearTo}`
              : "Non exécuté"}
            ok={!!meta.trainedAt}
          />
          <HealthRow
            label="Joueurs"
            detail={`${model.models.length} modèles · ${model.featureNames.length} features`}
            ok={model.models.length >= 4}
          />
        </div>
      </section>

      {model.models.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">
            Coefficients
            <Hint
              align="start"
              text="Un modèle distinct est entraîné pour chaque combinaison tour/surface. n indique le nombre de matchs utilisés pour l'entraînement — plus n est grand, plus les coefficients sont fiables."
            />
          </h2>
          <ul className="space-y-1 text-xs">
            {model.models.map((m) => (
              <li key={`${m.tour}-${m.surface}`} className="font-mono text-muted">
                {m.tour.toUpperCase()} · {m.surface} · n={m.nTrain}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function daysSince(iso: string): number {
  try {
    return (Date.now() - new Date(iso).getTime()) / 86_400_000;
  } catch {
    return Infinity;
  }
}

function timeAgo(iso: string): string {
  const h = Math.round(daysSince(iso) * 24);
  if (h < 1) return "il y a moins d'1h";
  if (h < 24) return `il y a ${h}h`;
  const d = Math.round(h / 24);
  return `il y a ${d}j`;
}

function HealthRow({
  label,
  detail,
  ok,
  warn,
}: {
  label: string;
  detail: string;
  ok: boolean;
  warn?: boolean;
}) {
  const dot = ok ? "bg-lime" : warn ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <div className={`size-2 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0 flex-1">
        <span className="font-medium text-text">{label}</span>
        <span className="text-muted"> · {detail}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-surface2 p-2.5 text-center">
      <div className="truncate text-[10px] uppercase tracking-wider text-muted">
        {label}
        {hint && <Hint text={hint} />}
      </div>
      <div className="truncate font-mono text-xl text-text">{value}</div>
    </div>
  );
}
