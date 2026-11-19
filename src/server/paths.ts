import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function packageRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(path.join(dir, "package.json")) && existsSync(path.join(dir, "data", "snapshot.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Could not locate the chokepoint package root (data/snapshot.json).");
}

export function snapshotPath(): string {
  return path.join(packageRoot(), "data", "snapshot.json");
}

export function feedsPath(): string {
  return path.join(packageRoot(), "data", "feeds.json");
}

export function cachePath(): string {
  const override = process.env.CHOKEPOINT_CACHE;
  if (override && override.trim()) return override;
  return path.join(packageRoot(), "data", "cache", "feeds.json");
}

export function clientDir(): string {
  return path.join(packageRoot(), "dist", "client");
}
