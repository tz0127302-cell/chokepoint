import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { FeedConfig } from "../src/lib/types.js";
import { USER_AGENT, refreshFeeds } from "../src/server/refresh.js";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const feeds: FeedConfig[] = [
  {
    id: "ok",
    publisher: "Example",
    url: "https://example.com/ok.xml",
    kind: "rss",
    enabled: true,
  },
  {
    id: "bad",
    publisher: "Broken",
    url: "https://example.com/bad.xml",
    kind: "rss",
    enabled: true,
  },
  {
    id: "off",
    publisher: "GDELT",
    url: "https://example.com/gdelt",
    kind: "gdelt",
    enabled: false,
  },
];

const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>Example</title><item><title>Strait of Hormuz fire</title><link>https://example.com/a</link><pubDate>Mon, 16 Nov 2026 08:00:00 GMT</pubDate><description>A tanker is on fire.</description></item></channel></rss>`;

function fetchImpl(okBody: string): typeof fetch {
  return (async (input, init) => {
    const url = String(input);
    expect(init?.headers && (init.headers as Record<string, string>)["user-agent"]).toBe(USER_AGENT);
    if (url.endsWith("bad.xml")) return new Response("no", { status: 503 });
    return new Response(okBody, { status: 200, headers: { "content-type": "application/rss+xml" } });
  }) as typeof fetch;
}

describe("refreshFeeds", () => {
  it("caches a success, keeps a stale copy when a feed later fails, and skips disabled feeds", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "chokepoint-"));
    dirs.push(dir);
    const cachePath = path.join(dir, "feeds.json");
    const first = await refreshFeeds({
      feeds,
      cachePath,
      fetchImpl: fetchImpl(rss),
      now: new Date("2026-11-16T12:00:00.000Z"),
    });
    expect(first.ok).toBe(true);
    expect(first.feeds.find((feed) => feed.id === "ok")?.items).toBe(1);
    expect(first.feeds.find((feed) => feed.id === "bad")?.ok).toBe(false);
    expect(first.feeds.find((feed) => feed.id === "off")?.skipped).toBe(true);

    const second = await refreshFeeds({
      feeds,
      cachePath,
      fetchImpl: (async () => new Response("down", { status: 500 })) as typeof fetch,
      now: new Date("2026-11-16T13:00:00.000Z"),
    });
    expect(second.ok).toBe(false);
    const stale = second.feeds.find((feed) => feed.id === "ok");
    expect(stale?.stale).toBe(true);
    expect(stale?.items).toBe(1);
    const saved = JSON.parse(await readFile(cachePath, "utf8")) as { schema: number };
    expect(saved.schema).toBe(1);
  });

  it("times out a feed that never answers", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "chokepoint-"));
    dirs.push(dir);
    const hanging: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    const result = await refreshFeeds({
      feeds: [feeds[0]!],
      cachePath: path.join(dir, "feeds.json"),
      fetchImpl: hanging,
      timeoutMs: 30,
    });
    expect(result.ok).toBe(false);
    expect(result.feeds[0]?.error).toMatch(/Timed out/);
  });

  it("reports a missing cache in offline mode", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "chokepoint-"));
    dirs.push(dir);
    const result = await refreshFeeds({
      feeds,
      cachePath: path.join(dir, "missing.json"),
      offline: true,
    });
    expect(result.ok).toBe(false);
    expect(result.fromCacheOnly).toBe(true);
  });
});
