import { readFile } from "node:fs/promises";
import { passages } from "../lib/passages.js";
import { assertSnapshot } from "../lib/validate.js";
import { buildDataset } from "../lib/dataset.js";
import type { Dataset, FeedHealth, LiveBundle, ParsedItem } from "../lib/types.js";
import { cachePath, snapshotPath } from "./paths.js";

export interface FeedCacheEntry {
  id: string;
  publisher: string;
  url: string;
  ok: boolean;
  stale: boolean;
  skipped: boolean;
  error: string | null;
  items: ParsedItem[];
}

export interface FeedCacheFile {
  schema: 1;
  fetchedAt: string;
  feeds: FeedCacheEntry[];
}

export function cacheToLive(cache: FeedCacheFile): LiveBundle {
  const feeds: FeedHealth[] = cache.feeds.map((feed) => ({
    id: feed.id,
    publisher: feed.publisher,
    url: feed.url,
    ok: feed.ok,
    stale: feed.stale,
    skipped: feed.skipped,
    items: feed.items.length,
    error: feed.error,
  }));
  return {
    fetchedAt: cache.fetchedAt,
    items: cache.feeds.flatMap((feed) => feed.items),
    feeds,
  };
}

export async function readCache(file = cachePath()): Promise<FeedCacheFile | null> {
  try {
    const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
    if (!raw || typeof raw !== "object") return null;
    const record = raw as Partial<FeedCacheFile>;
    if (record.schema !== 1 || typeof record.fetchedAt !== "string" || !Array.isArray(record.feeds)) return null;
    return record as FeedCacheFile;
  } catch {
    return null;
  }
}

export async function loadDataset(options?: { fixtureOnly?: boolean; cacheFile?: string }): Promise<Dataset> {
  const snapshot = assertSnapshot(
    JSON.parse(await readFile(snapshotPath(), "utf8")) as unknown,
    passages.map((passage) => passage.id),
  );
  const cache = options?.fixtureOnly ? null : await readCache(options?.cacheFile ?? cachePath());
  const hasItems = Boolean(cache?.feeds.some((feed) => feed.items.length > 0));
  const live = cache && hasItems ? cacheToLive(cache) : null;
  const dataset = buildDataset({ passages, snapshot, live });
  if (cache && !hasItems) {
    const summary = cacheToLive(cache);
    return { ...dataset, feeds: summary.feeds, liveFetchedAt: summary.fetchedAt };
  }
  return dataset;
}
