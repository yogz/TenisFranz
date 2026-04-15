import Link from "next/link";
import {
  loadBacktest,
  loadMeta,
  loadModel,
  loadPlayers,
  loadUpcoming,
  loadVsMarket,
} from "@/lib/data";
import { CalibrationChart } from "@/components/charts/CalibrationChart";
import { AccuracyOverTime } from "@/components/charts/AccuracyOverTime";
import { BankrollCurve } from "@/components/charts/BankrollCurve";

export default async function ModelPage() {
  const [backtest, meta, model, upcoming, players, vsMarket] = await Promise.all([
    loadBacktest(),
    loadMeta(),
    loadModel(),
    loadUpcoming(),
    loadPlayers(),
    loadVsMarket(),
  ]);
  const tours = Object.keys(backtest) as Array<keyof typeof backtest>;

  // Top 5 picks du modèle, sorted by confidence (distance from 0.5).
  const playerBySlug = new Map(players.map((p) => [p.slug, p]));
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
          Régression logistique · {meta.yearFrom}-{meta.yearTo} · entraîné le{" "}
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
        </h2>
        {hasHistorical ? (
          <div className="card space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="ROI modèle"
                value={`${vsMarket.roi >= 0 ? "+" : ""}${(vsMarket.roi * 100).toFixed(1)}%`}
              />
              <Stat label="Picks" value={vsMarket.picksCount.toLocaleString("fr-FR")} />
              <Stat
                label="Favori toujours"
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
              <Stat label="Précision" value={`${(m.accuracy * 100).toFixed(1)}%`} />
              <Stat label="Log loss" value={m.logLoss.toFixed(3)} />
              <Stat label="Brier" value={m.brier.toFixed(3)} />
            </div>
            <div className="card">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted">
                Précision par an
              </div>
              <AccuracyOverTime data={m.byYear} />
            </div>
            <div className="card">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted">Calibration</div>
              <CalibrationChart data={m.calibration} />
            </div>
          </section>
        );
      })}

      {model.models.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">Coefficients</h2>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface2 p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-display text-2xl text-text">{value}</div>
    </div>
  );
}
