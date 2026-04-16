/**
 * Before/after visualization for adjustments impact.
 *
 * Shows two stacked probability bars (model-only vs adjusted) with a delta
 * badge and an optional "edge vs bookmakers" line when odds are available.
 */

export function AdjustmentImpact({
  pWinner,
  pWinnerAdj,
  deltaPts,
  winnerName,
  loserName,
  bookieProbWinner,
}: {
  pWinner: number;
  pWinnerAdj: number;
  deltaPts: number;
  winnerName: string;
  loserName: string;
  /** Bookie implied probability on the winner side (0-1). */
  bookieProbWinner?: number;
}) {
  const pctBase = Math.round(pWinner * 100);
  const pctAdj = Math.round(pWinnerAdj * 100);
  const edgeVsBookies =
    bookieProbWinner != null
      ? Math.round((pWinnerAdj - bookieProbWinner) * 100)
      : null;

  return (
    <div className="space-y-3 rounded-xl bg-surface2 p-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        Impact des ajustements
      </div>

      {/* Base bar */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-muted">Modèle seul</span>
          <span className="font-mono text-muted">{pctBase}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-muted/30 transition-[width] duration-500"
            style={{ width: `${pctBase}%` }}
          />
        </div>
      </div>

      {/* Adjusted bar */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-text">Avec tes ajustements</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-text">{pctAdj}%</span>
            <span
              className={
                "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold " +
                (deltaPts > 0
                  ? "bg-lime/15 text-lime"
                  : deltaPts < 0
                  ? "bg-red-400/15 text-red-300"
                  : "bg-surface text-muted")
              }
            >
              {deltaPts > 0 ? "+" : ""}
              {deltaPts}pts
            </span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-700"
            style={{ width: `${pctAdj}%` }}
          />
        </div>
      </div>

      {/* Edge vs bookies */}
      {edgeVsBookies != null && (
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[11px]">
          <span className="text-muted">Ton edge vs bookmakers</span>
          <span
            className={
              "font-mono font-semibold " +
              (edgeVsBookies > 0
                ? "text-lime"
                : edgeVsBookies < 0
                ? "text-red-300"
                : "text-muted")
            }
          >
            {edgeVsBookies > 0 ? "+" : ""}
            {edgeVsBookies}pts
          </span>
        </div>
      )}
    </div>
  );
}
