export type Tour = "atp" | "wta";
export type Surface = "Hard" | "Clay" | "Grass";

export interface Player {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  age: number | null;
  tour: Tour;
  rank: number;
}

export interface EloRow {
  id: string;
  surface: Surface;
  elo: number;
  matches: number;
}

export interface TrainedModel {
  tour: Tour;
  surface: Surface;
  intercept: number;
  coefficients: number[];
  scalerMean: number[];
  scalerScale: number[];
  featureNames: string[];
  nTrain: number;
  trainedAt: string;
}

export interface ModelBundle {
  featureNames: string[];
  surfaces: Surface[];
  models: TrainedModel[];
}

export interface BacktestMetrics {
  tour: Tour;
  accuracy: number;
  logLoss: number;
  brier: number;
  nTest: number;
  byYear: { year: number; surface: Surface; accuracy: number; n: number }[];
  calibration: { bin: number; observed: number; predicted: number; count: number }[];
}

export type BacktestBundle = Record<Tour, BacktestMetrics>;

export interface Meta {
  yearFrom: number;
  yearTo: number;
  trainedAt: string;
  featureNames: string[];
}
