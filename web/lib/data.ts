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

/**
 * Module-level promise cache for data loaders.
 *
 * Without this, a build that statically generates N player pages reads and
 * reparses every `.json` file N times — `players.json` alone is ~3 MB, so
 * building 4k player profiles was wasting minutes reparsing the same blob
 * ~4k times. Caching the Promise (not the resolved value) is enough: all
 * callers await the same parse.
 *
 * Next.js guarantees a single module instance per build, so this is safe.
 * In dev (`next dev`), a file edit triggers a full module reload, which
 * also busts the cache — so stale data isn't an issue.
 */
const cache = new Map<string, Promise<unknown>>();

function readJson<T>(name: string, fallback: T): Promise<T> {
  const cached = cache.get(name) as Promise<T> | undefined;
  if (cached) return cached;
  const p = (async () => {
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, name), "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  })();
  cache.set(name, p);
  return p;
}

export const loadPlayers = () => readJson<Player[]>("players.json", []);

/**
 * Cached derived indices over the players list. Building these once and
 * reusing across all 4k player profile pages saves another ~10s on large
 * static builds (Map construction at N=4k × 4k pages is O(N²) worth of
 * allocations).
 *
 * Returns: `{ all, bySlug, byId, byTour }`. The `byTour` entries are
 * pre-filtered arrays — callers like the player nav search use them
 * directly without re-filtering.
 */
export interface PlayersIndex {
  all: Player[];
  bySlug: Map<string, Player>;
  byId: Map<string, Player>;
  byTour: { atp: Player[]; wta: Player[] };
}

let playersIndexCache: Promise<PlayersIndex> | null = null;

export function loadPlayersIndex(): Promise<PlayersIndex> {
  if (playersIndexCache) return playersIndexCache;
  playersIndexCache = loadPlayers().then((all) => {
    const bySlug = new Map<string, Player>();
    const byId = new Map<string, Player>();
    const byTour: { atp: Player[]; wta: Player[] } = { atp: [], wta: [] };
    for (const p of all) {
      bySlug.set(p.slug, p);
      byId.set(p.id, p);
      if (p.tour === "atp") byTour.atp.push(p);
      else if (p.tour === "wta") byTour.wta.push(p);
    }
    return { all, bySlug, byId, byTour };
  });
  return playersIndexCache;
}
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
