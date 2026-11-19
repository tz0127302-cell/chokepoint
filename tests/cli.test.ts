import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { execute } from "../src/cli/run.js";

const execFileAsync = promisify(execFile);
const previous = process.env.CHOKEPOINT_CACHE;
const dirs: string[] = [];

afterEach(async () => {
  if (previous === undefined) delete process.env.CHOKEPOINT_CACHE;
  else process.env.CHOKEPOINT_CACHE = previous;
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: {
      log: (message: string) => out.push(message),
      error: (message: string) => err.push(message),
      color: false,
    },
    out,
    err,
  };
}

describe("cli", () => {
  it("lists the fixture as JSON", async () => {
    const { io, out } = capture();
    const code = await execute(["list", "--json", "--fixture"], io);
    expect(code).toBe(0);
    const payload = JSON.parse(out.join("\n")) as { mode: string; passages: Array<{ id: string; status: string }>; disclaimer: string };
    expect(payload.mode).toBe("fixture");
    expect(payload.passages).toHaveLength(7);
    expect(payload.passages.find((passage) => passage.id === "hormuz")?.status).toBe("disrupted");
    expect(payload.disclaimer).toMatch(/financial advice/);
  });

  it("prints a human status for hormuz and rejects an unknown passage", async () => {
    const shown = capture();
    expect(await execute(["status", "strait of hormuz", "--fixture"], shown.io)).toBe(0);
    expect(shown.out.join("\n")).toMatch(/Strait of Hormuz/);
    expect(shown.out.join("\n")).toMatch(/disrupted/);
    expect(shown.out.join("\n")).toMatch(/Not navigational/);

    const missing = capture();
    expect(await execute(["status", "atlantis"], missing.io)).toBe(1);
    expect(missing.err.join("\n")).toMatch(/Unknown passage/);
  });

  it("filters news", async () => {
    const { io, out } = capture();
    expect(await execute(["news", "--passage", "suez", "--limit", "5", "--fixture"], io)).toBe(0);
    const text = out.join("\n");
    expect(text).toMatch(/Suez/);
    expect(text).not.toMatch(/Strait of Hormuz/);
  });

  it("fails offline update when there is no cache", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "chokepoint-cli-"));
    dirs.push(dir);
    process.env.CHOKEPOINT_CACHE = path.join(dir, "feeds.json");
    const { io, out } = capture();
    expect(await execute(["update", "--offline"], io)).toBe(1);
    expect(out.join("\n")).toMatch(/No cache/);
  });

  it("shows help with no arguments", async () => {
    const { io, out } = capture();
    expect(await execute([], io)).toBe(0);
    expect(out.join("\n")).toMatch(/chokepoint list/);
  });
});

describe("bin", () => {
  it("runs list --fixture through the executable", async () => {
    const { stdout } = await execFileAsync(process.execPath, ["bin/chokepoint.js", "list", "--json", "--fixture"], {
      cwd: process.cwd(),
    });
    const payload = JSON.parse(stdout) as { passages: unknown[] };
    expect(payload.passages).toHaveLength(7);
  }, 20000);
});
