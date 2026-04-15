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
  form_diff: "Forme récente",
  h2h_diff: "Face-à-face",
  fatigue_diff: "Fatigue",
  age_diff: "Âge",
  age_sq_diff: "Courbe d'âge",
  tourney_weight: "Importance tournoi",
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
  return {
    elo_surface_diff: a.eloSurface - b.eloSurface,
    serve_pts_won_diff: a.servePct - b.servePct,
    return_pts_won_diff: a.returnPct - b.returnPct,
    form_diff: a.form - b.form,
    h2h_diff: a.h2h - b.h2h,
    fatigue_diff: a.fatigue - b.fatigue,
    age_diff: a.age - b.age,
    age_sq_diff: a.ageSq - b.ageSq,
    tourney_weight: tourneyWeight,
  };
}

export function predict(
  playerA: Player,
  playerB: Player,
  elo: EloRow[],
  model: TrainedModel,
  surface: Surface,
  tourneyWeight = 2.0,
): PredictionResult {
  const fa = buildPlayerFeatures(playerA, elo, surface);
  const fb = buildPlayerFeatures(playerB, elo, surface);
  const raw = featureVector(fa, fb, tourneyWeight);

  let logit = model.intercept;
  const contributions: FeatureContribution[] = [];
  for (let i = 0; i < model.featureNames.length; i++) {
    const name = model.featureNames[i];
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
