import {
  loadBacktest,
  loadMeta,
  loadModel,
  loadUpcoming,
  loadVsMarket,
} from "@/lib/data";
import { CalibrationChart } from "@/components/charts/CalibrationChart";
import { AccuracyOverTime } from "@/components/charts/AccuracyOverTime";
import { BankrollCurve } from "@/components/charts/BankrollCurve";
import { Hint } from "@/components/Hint";

export default async function ModelPage() {
  const [backtest, meta, model, upcoming, vsMarket] = await Promise.all([
    loadBacktest(),
    loadMeta(),
    loadModel(),
    loadUpcoming(),
    loadVsMarket(),
  ]);
  const tours = Object.keys(backtest) as Array<keyof typeof backtest>;

  const hasHistorical = vsMarket.picksCount > 0 && vsMarket.bankrollCurve.length > 0;

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

      {/* Simulation historique vs marché */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted">
          Simulation historique vs marché
          <Hint
            align="start"
            text="On rejoue le passé : pour chaque match, on compare la prédiction du modèle aux cotes du marché et on simule un pari de valeur. Permet de voir si le modèle aurait battu les bookmakers."
          />
        </h2>
        {hasHistorical ? (
          <div className="card space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="ROI modèle"
                hint="Return On Investment : gain (ou perte) cumulé en pourcentage de la mise totale. +5 % signifie qu'on a gagné 5 € pour 100 € misés."
                value={`${vsMarket.roi >= 0 ? "+" : ""}${(vsMarket.roi * 100).toFixed(1)}%`}
              />
              <Stat
                label="Picks"
                hint="Nombre total de paris simulés sur la période. Plus le nombre est grand, plus le ROI est statistiquement fiable."
                value={vsMarket.picksCount.toLocaleString("fr-FR")}
              />
              <Stat
                label="Favori toujours"
                hint="Stratégie de référence : parier systématiquement sur le favori du marché. Sert de baseline pour mesurer la valeur ajoutée du modèle."
                value={`${vsMarket.baselines.favoriteAlways >= 0 ? "+" : ""}${(vsMarket.baselines.favoriteAlways * 100).toFixed(1)}%`}
              />
            </div>
            <BankrollCurve data={vsMarket.bankrollCurve} />
            <div className="space-y-3 rounded-lg bg-surface2 px-3 py-3 text-[11px] leading-relaxed text-muted">
              <p>
                <span className="text-text">Un ROI négatif est normal.</span>{" "}
                Les bookmakers prélèvent une marge (~4-5%) sur chaque match,
                ce qui rend les paris perdants à long terme pour tout le monde
                — même avec un bon modèle. C'est la même logique que le casino :
                la maison gagne toujours sur le volume.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div>
                  <div className="text-muted">Pile ou face</div>
                  <div className="font-mono text-sm text-red-400">{(vsMarket.baselines.random * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted">Toujours le favori</div>
                  <div className="font-mono text-sm text-red-400">{(vsMarket.baselines.favoriteAlways * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted">Notre modèle</div>
                  <div className="font-mono text-sm text-lime">{(vsMarket.roi * 100).toFixed(1)}%</div>
                </div>
              </div>
              <p>
                Le modèle est <span className="text-text">moins mauvais</span> que
                les alternatives (~{((vsMarket.roi - vsMarket.baselines.favoriteAlways) * 100).toFixed(0)} point
                de mieux que «{"\u00A0"}toujours le favori{"\u00A0"}»), ce qui prouve
                qu'il capte un vrai signal statistique — mais pas assez pour
                couvrir la marge du bookmaker.
              </p>
              <p>
                Ce site ne dit pas «{"\u00A0"}parie et gagne{"\u00A0"}» — il dit{" "}
                <span className="text-text">qui va probablement gagner et pourquoi</span>,
                ce qui est déjà utile pour un fan de tennis même sans parier.
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              {vsMarket.methodology}
            </p>
            <p className="text-[10px] text-muted/70">{vsMarket.source}</p>
          </div>
        ) : (
          <div className="card text-sm text-muted">
            La simulation historique n&apos;a pas encore été calculée.
            Lance{" "}
            <code className="font-mono text-text">
              uv run python -m tenisfranz.historical_roi
            </code>{" "}
            pour générer <code className="font-mono text-text">vs_market.json</code>.
          </div>
        )}
      </section>


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
            label="ROI simulation"
            detail={vsMarket.picksCount > 0
              ? `${vsMarket.picksCount.toLocaleString("fr-FR")} picks · ROI ${(vsMarket.roi * 100).toFixed(1)}%`
              : "Non calculée"}
            ok={vsMarket.picksCount > 0}
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
    <div className="rounded-xl bg-surface2 p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted">
        {label}
        {hint && <Hint text={hint} />}
      </div>
      <div className="font-mono text-2xl text-text">{value}</div>
    </div>
  );
}
