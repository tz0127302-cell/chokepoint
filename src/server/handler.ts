import { readFile } from "node:fs/promises";
import { assertFeeds } from "../lib/validate.js";
import { VERSION } from "../lib/version.js";
import { loadDataset } from "./load.js";
import { cachePath, feedsPath } from "./paths.js";
import { refreshFeeds } from "./refresh.js";

export interface HttpResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

function json(status: number, body: unknown): HttpResult {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

let inflight: Promise<HttpResult> | null = null;

async function runUpdate(): Promise<HttpResult> {
  const feeds = assertFeeds(JSON.parse(await readFile(feedsPath(), "utf8")) as unknown);
  const refresh = await refreshFeeds({ feeds, cachePath: cachePath() });
  const dataset = await loadDataset();
  return json(200, {
    ok: refresh.ok,
    dataset,
    refresh: {
      fetchedAt: refresh.fetchedAt,
      fromCacheOnly: refresh.fromCacheOnly,
      matched: dataset.news.filter((item) => item.origin === "live").length,
      feeds: refresh.feeds,
    },
  });
}

export async function dispatch(method: string, rawUrl: string): Promise<HttpResult> {
  const url = new URL(rawUrl, "http://127.0.0.1");
  const pathname = url.pathname;

  if (pathname === "/api/health") {
    if (method !== "GET") return json(405, { error: "Method not allowed" });
    return json(200, { ok: true, version: VERSION });
  }

  if (pathname === "/api/dataset") {
    if (method !== "GET") return json(405, { error: "Method not allowed" });
    const dataset = await loadDataset({ fixtureOnly: url.searchParams.get("fixture") === "1" });
    return json(200, dataset);
  }

  if (pathname === "/api/update") {
    if (method !== "POST") return json(405, { error: "Method not allowed" });
    if (!inflight) {
      inflight = runUpdate().finally(() => {
        inflight = null;
      });
    }
    return inflight;
  }

  if (pathname.startsWith("/api/")) return json(404, { error: "Not found" });
  return json(404, { error: "Not found" });
}
