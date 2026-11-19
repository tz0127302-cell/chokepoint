import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDate, parseFeed, parseGdelt } from "../src/lib/parseFeed.js";
import { htmlToText, toSnippet } from "../src/lib/text.js";

const rss = readFileSync(new URL("./fixtures/sample.rss.xml", import.meta.url), "utf8");
const atom = readFileSync(new URL("./fixtures/sample.atom.xml", import.meta.url), "utf8");
const gdelt = readFileSync(new URL("./fixtures/gdelt.json", import.meta.url), "utf8");

describe("text", () => {
  it("strips tags and scripts and decodes entities", () => {
    expect(htmlToText("<p>Oil &amp; gas</p><script>alert(1)</script>")).toBe("Oil & gas");
    expect(htmlToText("A &#39;mine&#39; and &hellip;")).toBe("A 'mine' and …");
  });

  it("truncates on a word boundary", () => {
    const snippet = toSnippet("word ".repeat(80), 80);
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(80);
  });
});

describe("parseFeed", () => {
  it("parses RSS, drops items without links, and dedupes", () => {
    const items = parseFeed(rss, "Example");
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Strait of Hormuz & mines");
    expect(items[0]?.url).toBe("https://example.com/hormuz");
    expect(items[0]?.snippet).toContain("naval mine");
    expect(items[0]?.snippet).not.toContain("script");
    expect(items[0]?.publishedAt).toBe("2026-11-16T08:00:00.000Z");
  });

  it("parses Atom alternate links and HTML summaries", () => {
    const items = parseFeed(atom, "Example Atom");
    expect(items).toHaveLength(1);
    expect(items[0]?.url).toBe("https://example.com/bab");
    expect(items[0]?.snippet).toBe("Forces withdrew from the strait.");
    expect(items[0]?.publishedAt).toBe("2026-11-15T18:00:00.000Z");
  });

  it("rejects malformed XML and unknown roots", () => {
    expect(() => parseFeed("<rss>", "X")).toThrow(/parsed|Unrecognized|channel/i);
    expect(() => parseFeed("<html><body>no</body></html>", "X")).toThrow(/Unrecognized/);
  });

  it("parses GDELT dates and drops bad URLs", () => {
    const items = parseGdelt(gdelt, "GDELT DOC");
    expect(items).toHaveLength(1);
    expect(items[0]?.publishedAt).toBe("2026-11-16T12:00:00.000Z");
    expect(items[0]?.snippet).toContain("example.com");
    expect(parseDate("20261116T120000Z")).toBe("2026-11-16T12:00:00.000Z");
    expect(parseDate("not a date")).toBeNull();
  });
});
