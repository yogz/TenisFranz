import Link from "next/link";
import {
  loadBacktest,
  loadMeta,
  loadModel,
  loadPlayersIndex,
  loadUpcoming,
  loadVsMarket,
} from "@/lib/data";
import { CalibrationChart } from "@/components/charts/CalibrationChart";
import { AccuracyOverTime } from "@/components/charts/AccuracyOverTime";
import { BankrollCurve } from "@/components/charts/BankrollCurve";
import { Hint } from "@/components/Hint";

export default async function ModelPage() {
  const [backtest, meta, model, upcoming, playersIdx, vsMarket] = await Promise.all([
    loadBacktest(),
    loadMeta(),
    loadModel(),
    loadUpcoming(),
    loadPlayersIndex(),
    loadVsMarket(),
  ]);
  const tours = Object.keys(backtest) as Array<keyof typeof backtest>;

  // Top 5 picks du modèle, sorted by confidence (distance from 0.5).
  const playerBySlug = playersIdx.bySlug;
  const topPicks = [...upcoming.matches]
    .map((m) => ({ m, conf: Math.abs(m.modelProbA - 0.5) }))
    .sort((a, b) => b.conf - a.conf)
    .slice(0, 5);
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

      {/* Picks du modèle — live predictions from matches_upcoming.json. */}
      {topPicks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-wider text-muted">
              Picks du modèle
              <Hint
                align="start"
                text="Les matchs à venir où le modèle est le plus sûr de lui — c'est-à-dire ceux dont la probabilité prédite est la plus éloignée de 50/50."
              />
            </h2>
            <Link href="/matches" className="text-[11px] text-muted hover:text-text">
              Voir tout →
            </Link>
          </div>
          <ul className="space-y-2">
            {topPicks.map(({ m, conf }) => {
              const aWins = m.modelProbA >= 0.5;
              const favSlug = aWins ? m.playerA : m.playerB;
              const underSlug = aWins ? m.playerB : m.playerA;
              const fav = playerBySlug.get(favSlug);
              const under = playerBySlug.get(underSlug);
              const favName = fav?.lastName ?? favSlug;
              const underName = under?.lastName ?? underSlug;
              const favPct = Math.round((aWins ? m.modelProbA : 1 - m.modelProbA) * 100);
              return (
                <li key={m.id}>
                  <Link
                    href={{ pathname: "/", query: { a: m.playerA, b: m.playerB, s: m.surface } }}
                    className="card card-hover flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-text">
                        {favName} <span className="text-muted">vs</span> {underName}
                      </div>
                      <div className="truncate text-[11px] text-muted">
                        {m.tournament} · {m.round}
                      </div>
                    </div>
                    <div className="shrink-0 font-display text-2xl text-lime">
                      {favPct}
                      <span className="text-sm text-lime/60">%</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-muted">
            Les picks les plus confiants du modèle parmi {upcoming.matches.length} matchs à
            venir. Pas un conseil de pari.
          </p>
        </section>
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

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface2 p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted">
        {label}
        {hint && <Hint text={hint} />}
      </div>
      <div className="font-display text-2xl text-text">{value}</div>
    </div>
  );
}
