import fs from "node:fs/promises";
import path from "node:path";
import type {
  BacktestBundle,
  EloRow,
  Meta,
  ModelBundle,
  Player,
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
