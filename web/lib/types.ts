export type Tour = "atp" | "wta";
export type Surface = "Hard" | "Clay" | "Grass";
export type Hand = "R" | "L" | "A";

export interface SurfaceStat {
  wins: number;
  losses: number;
  winPct: number;
}

export interface RecentMatch {
  date: string;
  tournament: string;
  surface: Surface;
  round: string;
  opponent: string;
  opponentId: string;
  score: string;
  won: boolean;
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
  recentMatches?: RecentMatch[];
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

export interface CalibrationCurve {
  xs: number[];
  ys: number[];
}

export interface ModelBundle {
  featureNames: string[];
  surfaces: Surface[];
  models: TrainedModel[];
  /** Per-tour isotonic calibration curves fitted on walk-forward backtest
   * predictions. Keys are tour codes ("atp" / "wta"). Missing entries mean
   * no calibration is applied (identity transform). */
  calibration?: Partial<Record<Tour, CalibrationCurve>>;
}

export interface BacktestMetrics {
  tour: Tour;
  accuracy: number;
  logLoss: number;
  brier: number;
  nTest: number;
  byYear: { year: number; surface: Surface; accuracy: number; n: number }[];
  calibration: { bin: number; observed: number; predicted: number; count: number }[];
  /** Accuracy/logLoss/Brier after the isotonic calibration curve is
   * applied to the raw sigmoid output. Same dataset as the raw metrics.
   * Null if the pipeline ran before Phase 4. */
  accuracyCalibrated?: number | null;
  logLossCalibrated?: number | null;
  brierCalibrated?: number | null;
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
  /** Average bookmaker decimal odds on player A (from The Odds API). */
  oddsA?: number;
  /** Average bookmaker decimal odds on player B. */
  oddsB?: number;
  /** Contextual alert strings (odds movement, weather, etc). */
  signals?: string[];
}

export interface UpcomingWithdrawal {
  playerA: string;
  playerB: string;
  tournament: string;
}

export interface UpcomingBundle {
  updatedAt: string;
  modelTrainedAt: string | null;
  source: string;
  matches: UpcomingMatch[];
  stats: { fetched: number; resolved: number; missRatio: number };
  withdrawals?: UpcomingWithdrawal[];
  weather?: Record<string, { tempMax: number; windMax: number }>;
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
