import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDataset } from "../src/lib/dataset.js";
import { passages } from "../src/lib/passages.js";
import { matchPassages } from "../src/lib/match.js";
import { screenStatus } from "../src/lib/status.js";
import type { SnapshotFile } from "../src/lib/types.js";
import { assertFeeds, assertSnapshot } from "../src/lib/validate.js";
import { VERSION } from "../src/lib/version.js";
import { CHART_NODES } from "../src/web/chart.js";

const ids = passages.map((passage) => passage.id);
const snapshot = assertSnapshot(JSON.parse(readFileSync("data/snapshot.json", "utf8")) as unknown, ids);
const asOf = new Date(snapshot.generatedAt);

describe("fixture", () => {
  it("matches the package version and the seven passages", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
    expect(pkg.version).toBe(VERSION);
    expect(ids).toEqual(["hormuz", "bab-al-mandab", "suez", "panama", "malacca", "turkish", "cape"]);
    expect(CHART_NODES.map((node) => node.id).sort()).toEqual([...ids].sort());
  });

  it("keeps snippets short and passage tags aligned with the matcher", () => {
    expect(snapshot.news.length).toBeGreaterThanOrEqual(6);
    for (const item of snapshot.news) {
      expect(item.snippet.length).toBeLessThanOrEqual(400);
      expect(item.title).not.toMatch(/<[^>]+>/);
      const matched = matchPassages(`${item.title}\n${item.snippet}`, passages);
      expect(matched).toEqual(item.passageIds);
    }
  });

  it("agrees with the keyword screen, starting from open", () => {
    for (const passage of passages) {
      const curated = snapshot.passages[passage.id];
      expect(curated, passage.id).toBeTruthy();
      const headlines = snapshot.news.filter(
        (item) => (item.kind ?? "headline") === "headline" && item.passageIds.includes(passage.id),
      );
      const decision = screenStatus(
        "open",
        headlines.map((item) => ({
          text: `${item.title}\n${item.snippet}`,
          publishedAt: item.publishedAt,
          passageId: passage.id,
        })),
        asOf,
      );
      expect(decision.status, passage.id).toBe(curated?.status);
    }
  });

  it("builds a fixture dataset with Hormuz disrupted and Bab al-Mandab uncertain", () => {
    const dataset = buildDataset({ passages, snapshot, live: null, asOf });
    expect(dataset.mode).toBe("fixture");
    expect(dataset.disclaimer).toMatch(/Not navigational, operational, or financial advice/);
    expect(dataset.passages.find((passage) => passage.id === "hormuz")?.status).toBe("disrupted");
    expect(dataset.passages.find((passage) => passage.id === "bab-al-mandab")?.status).toBe("uncertain");
    expect(dataset.passages.find((passage) => passage.id === "suez")?.status).toBe("open");
    expect(dataset.passages.find((passage) => passage.id === "cape")?.status).toBe("open");
    expect(dataset.news.some((item) => item.kind === "note" && item.passageIds.includes("cape"))).toBe(true);
  });

  it("lets a live disruption raise an open baseline and dedupes URLs", () => {
    const dataset = buildDataset({
      passages,
      snapshot,
      asOf,
      live: {
        fetchedAt: "2026-11-16T18:00:00.000Z",
        feeds: [],
        items: [
          {
            id: "live-1",
            title: "Panama Canal closed after an incident",
            url: "https://example.com/panama",
            publisher: "Example",
            publishedAt: "2026-11-16T16:00:00.000Z",
            snippet: "The authority halted transit.",
          },
          {
            id: "live-dup",
            title: "ONE returns to the Suez Canal",
            url: snapshot.news.find((item) => item.passageIds.includes("suez"))?.url ?? "",
            publisher: "Example",
            publishedAt: "2026-11-16T16:00:00.000Z",
            snippet: "Duplicate of the fixture link.",
          },
        ],
      },
    });
    expect(dataset.mode).toBe("mixed");
    expect(dataset.passages.find((passage) => passage.id === "panama")?.status).toBe("disrupted");
    expect(dataset.passages.find((passage) => passage.id === "panama")?.baselineStatus).toBe("open");
    const suez = dataset.news.filter((item) => item.url.includes("suezcanal"));
    expect(suez).toHaveLength(1);
    expect(suez[0]?.origin).toBe("live");
  });

  it("rejects a snapshot URL with credentials", () => {
    const broken = structuredClone(snapshot) as SnapshotFile;
    broken.news[0] = { ...broken.news[0]!, url: "https://user:secret@example.com/a" };
    expect(() => assertSnapshot(broken, ids)).toThrow(/credentials/);
  });

  it("loads the public feed registry", () => {
    const feeds = assertFeeds(JSON.parse(readFileSync("data/feeds.json", "utf8")) as unknown);
    expect(feeds.filter((feed) => feed.enabled).length).toBeGreaterThanOrEqual(4);
    expect(feeds.some((feed) => feed.kind === "gdelt" && feed.enabled === false)).toBe(true);
    expect(feeds.every((feed) => feed.url.startsWith("https://"))).toBe(true);
  });
});
