export type Tour = "atp" | "wta";
export type Surface = "Hard" | "Clay" | "Grass";
export type Hand = "R" | "L" | "A";

export interface SurfaceStat {
  wins: number;
  losses: number;
  winPct: number;
}

export interface CareerStats {
  wins: number;
  losses: number;
  winPct: number;
  titles: number;
  bySurface: Record<Surface, SurfaceStat>;
  peakEloSurface: Record<Surface, number>;
  last10: ("W" | "L")[];
  lastMatchDate: string | null;
  lastTournaments: string[];
}

export interface Player {
  id: string;
  slug: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  countryIso: string | null;
  hand: Hand | null;
  heightCm: number | null;
  dob: string | null;
  age: number | null;
  tour: Tour;
  wikidataId: string | null;
  photoUrl: string | null;
  currentEloSurface: Record<Surface, number>;
  matchesBySurface: Record<Surface, number>;
  career: CareerStats;
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

export interface UpcomingMatch {
  id: string;
  date: string; // ISO yyyy-mm-dd
  tournament: string;
  round: string;
  surface: Surface;
  tour: Tour;
  playerA: string; // slug
  playerB: string; // slug
  modelProbA: number;
}

export interface UpcomingBundle {
  updatedAt: string;
  modelTrainedAt: string | null;
  source: string;
  matches: UpcomingMatch[];
  stats: { fetched: number; resolved: number; missRatio: number };
}

export interface H2HEntry {
  opponent: string; // tour-scoped player id, e.g. "atp-104925"
  wins: number;
  losses: number;
  bestSurface: Surface;
}

export type H2HBundle = Record<string, H2HEntry[]>;

export interface VsMarketBundle {
  methodology: string;
  source: string;
  picksCount: number;
  roi: number;
  bankrollCurve: { date: string; balance: number; picks: number }[];
  baselines: {
    favoriteAlways: number;
    modelAlways: number;
    random: number;
  };
}
