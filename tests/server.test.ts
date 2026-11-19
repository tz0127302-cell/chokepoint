import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveStatic } from "../src/server/static.js";
import { dispatch } from "../src/server/handler.js";

const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("static paths", () => {
  it("serves a file, falls back to index.html, and rejects traversal", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "chokepoint-static-"));
    dirs.push(dir);
    await writeFile(path.join(dir, "index.html"), "<p>ok</p>");
    await writeFile(path.join(dir, "app.js"), "console.log(1)");
    expect((await resolveStatic(dir, "/app.js")).kind).toBe("file");
    expect((await resolveStatic(dir, "/methodology")).kind).toBe("spa");
    expect((await resolveStatic(dir, "/../package.json")).kind).toBe("forbidden");
    expect((await resolveStatic(dir, "/%2e%2e/package.json")).kind).toBe("forbidden");
    expect((await resolveStatic(dir, "/missing.js")).kind).toBe("missing");
  });
});

describe("api", () => {
  it("serves the fixture dataset and refuses the wrong method", async () => {
    const dataset = await dispatch("GET", "/api/dataset?fixture=1");
    expect(dataset.status).toBe(200);
    const body = JSON.parse(dataset.body) as { mode: string; passages: Array<{ id: string; status: string }> };
    expect(body.mode).toBe("fixture");
    expect(body.passages.find((passage) => passage.id === "hormuz")?.status).toBe("disrupted");
    expect((await dispatch("GET", "/api/update")).status).toBe(405);
    expect((await dispatch("GET", "/api/health")).status).toBe(200);
    expect((await dispatch("GET", "/api/missing")).status).toBe(404);
  });
});
