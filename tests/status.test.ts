import { describe, expect, it } from "vitest";
import { passages } from "../src/lib/passages.js";
import { matchPassages } from "../src/lib/match.js";
import { resolvePassage } from "../src/lib/resolve.js";
import {
  CAPE_ROUTE_SHIFT,
  DISRUPT_PATTERNS,
  RESTORE_PATTERNS,
  UNCERTAIN_PATTERNS,
  classifyText,
  screenStatus,
} from "../src/lib/status.js";

const asOf = new Date("2026-11-16T12:00:00.000Z");

describe("match", () => {
  it("matches passage names and keeps catalog order", () => {
    expect(matchPassages("Ships left the Bab el-Mandeb for the Suez Canal", passages)).toEqual([
      "bab-al-mandab",
      "suez",
    ]);
  });

  it("does not treat Suezmax, Panama the country, or escape as passages", () => {
    expect(matchPassages("A Suezmax tanker near Panama", passages)).toEqual([]);
    expect(matchPassages("There is no escape", passages)).toEqual([]);
  });

  it("matches the Cape phrase and Malacca", () => {
    expect(matchPassages("tankers went around the Cape of Good Hope", passages)).toEqual(["cape"]);
    expect(matchPassages("the city of Malacca", passages)).toEqual(["malacca"]);
  });
});

describe("resolve", () => {
  it("accepts ids and aliases", () => {
    expect(resolvePassage("HORMUZ", passages)?.id).toBe("hormuz");
    expect(resolvePassage("bab el-mandeb", passages)?.id).toBe("bab-al-mandab");
    expect(resolvePassage("Bosporus", passages)?.id).toBe("turkish");
    expect(resolvePassage("good hope", passages)?.id).toBe("cape");
    expect(resolvePassage("nope", passages)).toBeUndefined();
  });
});

describe("status rules", () => {
  it("keeps patterns free of the global flag", () => {
    const patterns = [...DISRUPT_PATTERNS, ...UNCERTAIN_PATTERNS, ...RESTORE_PATTERNS, CAPE_ROUTE_SHIFT];
    expect(patterns.every((pattern) => !pattern.global)).toBe(true);
    const first = classifyText("naval mine in Hormuz", "hormuz");
    const second = classifyText("naval mine in Hormuz", "hormuz");
    expect(second).toEqual(first);
    expect(first.disrupt).toBe(true);
  });

  it("raises open to disrupted on one disruption headline", () => {
    const decision = screenStatus(
      "open",
      [{ text: "A tanker caught fire in the Strait of Hormuz", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "hormuz" }],
      asOf,
    );
    expect(decision.status).toBe("disrupted");
  });

  it("ignores headlines outside the 14-day window and far-future dates", () => {
    const old = screenStatus(
      "open",
      [{ text: "The canal closed", publishedAt: "2026-10-01T00:00:00.000Z", passageId: "suez" }],
      asOf,
    );
    const future = screenStatus(
      "open",
      [{ text: "The canal closed", publishedAt: "2026-11-20T00:00:00.000Z", passageId: "suez" }],
      asOf,
    );
    expect(old.status).toBe("open");
    expect(future.status).toBe("open");
  });

  it("marks uncertainty without calling it a closure", () => {
    const decision = screenStatus(
      "open",
      [
        {
          text: "Forces withdrew and advanced into overlooking positions",
          publishedAt: "2026-11-16T00:00:00.000Z",
          passageId: "bab-al-mandab",
        },
      ],
      asOf,
    );
    expect(decision.status).toBe("uncertain");
  });

  it("does not clear a disruption to open on one resumption headline", () => {
    const decision = screenStatus(
      "disrupted",
      [{ text: "Traffic resumed through the canal", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "suez" }],
      asOf,
    );
    expect(decision.status).toBe("uncertain");
    expect(decision.reason).toMatch(/one step/i);
  });

  it("steps an uncertain baseline to open on resumption alone", () => {
    const decision = screenStatus(
      "uncertain",
      [{ text: "The canal reopened", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "suez" }],
      asOf,
    );
    expect(decision.status).toBe("open");
  });

  it("keeps a disrupted baseline when live headlines conflict", () => {
    const decision = screenStatus(
      "disrupted",
      [
        { text: "A tanker is on fire", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "hormuz" },
        { text: "Transit resumed", publishedAt: "2026-11-16T01:00:00.000Z", passageId: "hormuz" },
      ],
      asOf,
    );
    expect(decision.status).toBe("disrupted");
  });

  it("turns a conflicting pair into uncertain when the baseline is open", () => {
    const decision = screenStatus(
      "open",
      [
        { text: "The strait closed", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "hormuz" },
        { text: "Traffic resumed", publishedAt: "2026-11-16T01:00:00.000Z", passageId: "hormuz" },
      ],
      asOf,
    );
    expect(decision.status).toBe("uncertain");
  });

  it("does not mark the Cape disrupted because ships are using it", () => {
    const text = "Tankers reroute around the Cape of Good Hope";
    expect(classifyText(text, "cape")).toEqual({ disrupt: false, uncertain: false, restore: false });
    expect(classifyText("tankers reroute away from the Suez Canal", "suez").uncertain).toBe(true);
    const decision = screenStatus(
      "open",
      [{ text, publishedAt: "2026-11-16T00:00:00.000Z", passageId: "cape" }],
      asOf,
    );
    expect(decision.status).toBe("open");
  });

  it("still treats a mine report at the Cape as disruption", () => {
    const decision = screenStatus(
      "open",
      [{ text: "A naval mine was reported around the Cape of Good Hope", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "cape" }],
      asOf,
    );
    expect(decision.status).toBe("disrupted");
  });

  it("keeps the baseline when nothing is in window", () => {
    expect(screenStatus("disrupted", [], asOf).status).toBe("disrupted");
  });

  it("does not treat mixed resumption and uncertainty as a clean reopen", () => {
    const decision = screenStatus(
      "open",
      [{ text: "Transit resumed but the report is unconfirmed", publishedAt: "2026-11-16T00:00:00.000Z", passageId: "suez" }],
      asOf,
    );
    expect(decision.status).toBe("uncertain");
  });
});
