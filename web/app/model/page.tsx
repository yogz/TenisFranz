import { loadBacktest, loadMeta, loadModel } from "@/lib/data";
import { CalibrationChart } from "@/components/charts/CalibrationChart";
import { AccuracyOverTime } from "@/components/charts/AccuracyOverTime";

export default async function ModelPage() {
  const [backtest, meta, model] = await Promise.all([loadBacktest(), loadMeta(), loadModel()]);
  const tours = Object.keys(backtest) as Array<keyof typeof backtest>;

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
