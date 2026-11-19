import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FeedConfig, FeedHealth, ParsedItem } from "../lib/types.js";
import { parseFeed, parseGdelt } from "../lib/parseFeed.js";
import { cacheToLive, readCache, type FeedCacheEntry, type FeedCacheFile } from "./load.js";

export const USER_AGENT = "chokepoint/0.1 (public maritime-status reader; local use)";
export const MAX_BYTES = 1_500_000;
export const DEFAULT_TIMEOUT_MS = 12_000;

export interface RefreshOptions {
  feeds: FeedConfig[];
  cachePath: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  timeoutMs?: number;
  offline?: boolean;
  concurrency?: number;
}

export interface RefreshResult {
  ok: boolean;
  fromCacheOnly: boolean;
  fetchedAt: string | null;
  feeds: FeedHealth[];
  items: ParsedItem[];
}

function cleanError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Request failed";
  return raw.replace(/\s+/g, " ").slice(0, 180);
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index] as T);
    }
  }
  const workers = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

async function fetchBody(url: string, fetchImpl: typeof fetch, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json;q=0.9, */*;q=0.1",
        "user-agent": USER_AGENT,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(declared) && declared > MAX_BYTES) throw new Error("Feed larger than 1.5 MB");
    const text = await response.text();
    if (text.length > MAX_BYTES) throw new Error("Feed larger than 1.5 MB");
    return text;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function healthOf(entry: FeedCacheEntry): FeedHealth {
  return {
    id: entry.id,
    publisher: entry.publisher,
    url: entry.url,
    ok: entry.ok,
    stale: entry.stale,
    skipped: entry.skipped,
    items: entry.items.length,
    error: entry.error,
  };
}

export async function refreshFeeds(options: RefreshOptions): Promise<RefreshResult> {
  const previous = await readCache(options.cachePath);
  const now = options.now ?? new Date();

  if (options.offline) {
    if (!previous) {
      return { ok: false, fromCacheOnly: true, fetchedAt: null, feeds: [], items: [] };
    }
    const live = cacheToLive(previous);
    return {
      ok: true,
      fromCacheOnly: true,
      fetchedAt: live.fetchedAt,
      feeds: live.feeds,
      items: live.items,
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const enabled = options.feeds.filter((feed) => feed.enabled);
  const skipped = options.feeds.filter((feed) => !feed.enabled);

  const fetched = await mapPool(enabled, options.concurrency ?? 4, async (feed) => {
    const prior = previous?.feeds.find((entry) => entry.id === feed.id && entry.items.length > 0);
    try {
      const body = await fetchBody(feed.url, fetchImpl, timeoutMs);
      const items = feed.kind === "gdelt" ? parseGdelt(body, feed.publisher) : parseFeed(body, feed.publisher);
      const entry: FeedCacheEntry = {
        id: feed.id,
        publisher: feed.publisher,
        url: feed.url,
        ok: true,
        stale: false,
        skipped: false,
        error: null,
        items,
      };
      return entry;
    } catch (error) {
      const entry: FeedCacheEntry = {
        id: feed.id,
        publisher: feed.publisher,
        url: feed.url,
        ok: false,
        stale: Boolean(prior),
        skipped: false,
        error: cleanError(error),
        items: prior?.items ?? [],
      };
      return entry;
    }
  });

  const skippedEntries: FeedCacheEntry[] = skipped.map((feed) => ({
    id: feed.id,
    publisher: feed.publisher,
    url: feed.url,
    ok: false,
    stale: false,
    skipped: true,
    error: null,
    items: [],
  }));

  const feeds = [...fetched, ...skippedEntries];
  const cache: FeedCacheFile = {
    schema: 1,
    fetchedAt: now.toISOString(),
    feeds,
  };
  await mkdir(path.dirname(options.cachePath), { recursive: true });
  await writeFile(options.cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");

  const freshOk = fetched.some((feed) => feed.ok);
  return {
    ok: freshOk,
    fromCacheOnly: false,
    fetchedAt: cache.fetchedAt,
    feeds: feeds.map(healthOf),
    items: feeds.flatMap((feed) => feed.items),
  };
}
