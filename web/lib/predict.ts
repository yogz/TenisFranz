import type { CalibrationCurve, EloRow, Player, Surface, TrainedModel } from "./types";

const DEFAULT_ELO = 1500;
const DEFAULT_SERVE = 0.63;
const DEFAULT_RETURN = 0.37;
const DEFAULT_FORM = 0.5;
const DEFAULT_H2H = 0.5;
const DEFAULT_FATIGUE = 0;
const DEFAULT_AGE = 25;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Apply a monotone piecewise-linear calibration curve to a raw probability.
 * Mirrors `pipeline/src/tenisfranz/inference.py::CalibrationView.apply`.
 * Out-of-range inputs clamp to the curve endpoints — the curve was fitted
 * on the empirical distribution of model outputs, so anything outside is
 * extrapolation we don't want.
 */
export function applyCalibration(prob: number, curve?: CalibrationCurve): number {
  if (!curve || curve.xs.length === 0) return prob;
  const { xs, ys } = curve;
  if (prob <= xs[0]) return ys[0];
  if (prob >= xs[xs.length - 1]) return ys[ys.length - 1];
  // Binary search for the right bin.
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= prob) lo = mid;
    else hi = mid;
  }
  const x0 = xs[lo];
  const x1 = xs[hi];
  const y0 = ys[lo];
  const y1 = ys[hi];
  if (x1 === x0) return y0;
  const t = (prob - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

export interface PlayerFeatures {
  eloSurface: number;
  servePct: number;
  returnPct: number;
  form: number;
  h2h: number;
  fatigue: number;
  age: number;
  ageSq: number;
}

export interface FeatureContribution {
  name: string;
  label: string;
  value: number;
}

export interface PredictionResult {
  probA: number;
  probB: number;
  contributions: FeatureContribution[];
  logit: number;
  surface: Surface;
}

const FEATURE_LABELS: Record<string, string> = {
  elo_surface_diff: "Elo surface",
  serve_pts_won_diff: "% points au service",
  return_pts_won_diff: "% points en retour",
  h2h_diff: "Face-à-face",
  age_diff: "Âge",
  age_sq_diff: "Courbe d'âge",
  tourney_weight: "Importance tournoi",
  // legacy — only surfaces if an older model.json is still deployed
  form_diff: "Forme récente",
  fatigue_diff: "Fatigue",
};

export function buildPlayerFeatures(
  player: Player,
  elo: EloRow[],
  surface: Surface,
): PlayerFeatures {
  const eloRow = elo.find((e) => e.id === player.id && e.surface === surface);
  const age = player.age ?? DEFAULT_AGE;
  return {
    eloSurface: eloRow?.elo ?? DEFAULT_ELO,
    servePct: DEFAULT_SERVE,
    returnPct: DEFAULT_RETURN,
    form: DEFAULT_FORM,
    h2h: DEFAULT_H2H,
    fatigue: DEFAULT_FATIGUE,
    age,
    ageSq: (age - 25) ** 2,
  };
}

function featureVector(
  a: PlayerFeatures,
  b: PlayerFeatures,
  tourneyWeight: number,
): Record<string, number> {
  // Mirrors pipeline/src/tenisfranz/inference.py::feature_vector.
  // `form_diff` / `fatigue_diff` still emitted for backwards-compat with
  // any cached older model.json that lists them — the loop in predict()
  // only reads keys that appear in model.featureNames, so extras are
  // harmless no-ops.
  return {
    elo_surface_diff: a.eloSurface - b.eloSurface,
    serve_pts_won_diff: a.servePct - b.servePct,
    return_pts_won_diff: a.returnPct - b.returnPct,
    h2h_diff: a.h2h - b.h2h,
    age_diff: a.age - b.age,
    age_sq_diff: a.ageSq - b.ageSq,
    tourney_weight: tourneyWeight,
    form_diff: a.form - b.form,
    fatigue_diff: a.fatigue - b.fatigue,
  };
}

/**
 * Adjustments that operate DIRECTLY on the model's logit output.
 *
 * Why: the previous design nudged feature inputs (e.g. "injured" pushed
 * form -0.15 and eloSurface -40), but two things made that unusable:
 * 1. After the 2026-04 leak fix, `form` and `fatigue` were dropped from
 *    the model entirely, so feature nudges on them became silent no-ops.
 * 2. Coefficient collinearity (even after the fix) means small feature
 *    deltas can be multiplied by non-obvious coefficients and produce a
 *    result in the "wrong" direction vs the user's mental model.
 *
 * Direct logit deltas decouple the adjustment system from the model's
 * internals: the UI guarantees direction, the magnitudes are calibrated
 * once by hand to map to user-intuitive probability changes around a
 * neutral 50/50 match.
 *
 * Rough conversion (around p=0.5):
 *   Δlogit +0.4  ≈  +10 pts of probability
 *   Δlogit +0.2  ≈  +5 pts
 *   Δlogit -0.2  ≈  -5 pts
 *   Δlogit -0.4  ≈ -10 pts
 * (non-linear at the extremes; sigmoid handles that naturally)
 */
export interface PredictAdjustments {
  /** Logit added to player A's side of the prediction. */
  logitA?: number;
  /** Logit added to player B's side of the prediction. */
  logitB?: number;
}

export function predict(
  playerA: Player,
  playerB: Player,
  elo: EloRow[],
  model: TrainedModel,
  surface: Surface,
  tourneyWeight = 2.0,
  adjustments?: PredictAdjustments,
  calibration?: CalibrationCurve,
): PredictionResult {
  const fa = buildPlayerFeatures(playerA, elo, surface);
  const fb = buildPlayerFeatures(playerB, elo, surface);
  const raw = featureVector(fa, fb, tourneyWeight);

  // Adjustments are applied as a direct logit shift after the model runs,
  // not as feature nudges — see PredictAdjustments doc.
  const logitShiftA = adjustments?.logitA ?? 0;
  const logitShiftB = adjustments?.logitB ?? 0;

  let logit = model.intercept + logitShiftA - logitShiftB;
  const contributions: FeatureContribution[] = [];
  for (let i = 0; i < model.featureNames.length; i++) {
    const name = model.featureNames[i];
    if (!(name in raw)) continue; // drift-tolerant: unknown feature → 0 logit
    const mean = model.scalerMean[i];
    const scale = model.scalerScale[i] || 1;
    const x = (raw[name] - mean) / scale;
    const coef = model.coefficients[i];
    const contribution = coef * x;
    logit += contribution;
    contributions.push({
      name,
      label: FEATURE_LABELS[name] ?? name,
      value: contribution,
    });
  }

  contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const rawProbA = sigmoid(logit);
  // Post-sigmoid calibration (isotonic). We re-normalize so probA + probB
  // still sums to exactly 1 after the non-linear transform — isotonic
  // calibration preserves monotonicity but not the "complement" property
  // (cal(p) + cal(1-p) ≠ 1 in general), so we pair-normalize explicitly.
  if (calibration) {
    const calA = applyCalibration(rawProbA, calibration);
    const calB = applyCalibration(1 - rawProbA, calibration);
    const sum = calA + calB;
    const probA = sum > 0 ? calA / sum : rawProbA;
    return { probA, probB: 1 - probA, contributions, logit, surface };
  }
  return { probA: rawProbA, probB: 1 - rawProbA, contributions, logit, surface };
}

/**
 * Blend model probability with bookmaker implied probability.
 *
 * Academic evidence (Kovalchik 2016, Vaughan Williams & Reade) shows that
 * a blend of model + market consistently outperforms either source alone:
 * the model captures historical structure (Elo, surface, age), while the
 * market captures live information (injuries, motivation, weather).
 *
 * Default blend: 65% model + 35% market. This ratio is the sweet spot
 * from tennis prediction literature — enough market weight to absorb
 * live signals, but not so much that we're just copying the bookies.
 *
 * When market odds are unavailable, returns the raw model probability.
 */
export function blendWithMarket(
  modelProbA: number,
  bookieOddsA?: number,
  bookieOddsB?: number,
  modelWeight = 0.65,
): number {
  if (bookieOddsA == null || bookieOddsB == null || bookieOddsA <= 1 || bookieOddsB <= 1) {
    return modelProbA;
  }
  // De-juice bookie odds (simple normalization — Shin's is in the pipeline
  // but for a quick client-side blend, normalization is good enough).
  const implA = 1 / bookieOddsA;
  const implB = 1 / bookieOddsB;
  const total = implA + implB;
  const bookieProbA = implA / total;
  const blended = modelWeight * modelProbA + (1 - modelWeight) * bookieProbA;
  return Math.max(0.01, Math.min(0.99, blended));
}

export function pickModel(
  models: TrainedModel[],
  tour: string,
  surface: Surface,
): TrainedModel | undefined {
  return models.find((m) => m.tour === tour && m.surface === surface);
}
