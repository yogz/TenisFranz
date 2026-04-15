import type { EloRow, Player, Surface, TrainedModel } from "./types";

const DEFAULT_ELO = 1500;
const DEFAULT_SERVE = 0.63;
const DEFAULT_RETURN = 0.37;
const DEFAULT_FORM = 0.5;
const DEFAULT_H2H = 0.5;
const DEFAULT_FATIGUE = 0;
const DEFAULT_AGE = 25;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

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
  const probA = sigmoid(logit);
  return { probA, probB: 1 - probA, contributions, logit, surface };
}

export function pickModel(
  models: TrainedModel[],
  tour: string,
  surface: Surface,
): TrainedModel | undefined {
  return models.find((m) => m.tour === tour && m.surface === surface);
}
