import fs from "node:fs/promises";
import path from "node:path";
import type {
  BacktestBundle,
  EloRow,
  H2HBundle,
  Meta,
  ModelBundle,
  Player,
  UpcomingBundle,
  VsMarketBundle,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const loadPlayers = () => readJson<Player[]>("players.json", []);
export const loadElo = () => readJson<EloRow[]>("elo.json", []);
export const loadModel = () =>
  readJson<ModelBundle>("model.json", { featureNames: [], surfaces: [], models: [] });
export const loadBacktest = () => readJson<BacktestBundle>("backtest.json", {} as BacktestBundle);
export const loadMeta = () =>
  readJson<Meta>("meta.json", {
    yearFrom: 0,
    yearTo: 0,
    trainedAt: "",
    featureNames: [],
  });
export const loadUpcoming = () =>
  readJson<UpcomingBundle>("matches_upcoming.json", {
    updatedAt: "1970-01-01T00:00:00+00:00",
    modelTrainedAt: null,
    source: "seed",
    matches: [],
    stats: { fetched: 0, resolved: 0, missRatio: 0 },
  });
export const loadH2h = () => readJson<H2HBundle>("h2h.json", {});
export const loadVsMarket = () =>
  readJson<VsMarketBundle>("vs_market.json", {
    methodology: "not yet computed",
    source: "seed",
    picksCount: 0,
    roi: 0,
    bankrollCurve: [],
    baselines: { favoriteAlways: 0, modelAlways: 0, random: 0 },
  });
