import { stat } from "node:fs/promises";
import path from "node:path";

export type StaticResolution =
  | { kind: "file"; file: string }
  | { kind: "spa"; file: string }
  | { kind: "missing" }
  | { kind: "forbidden" };

export async function resolveStatic(root: string, rawUrl: string): Promise<StaticResolution> {
  const question = rawUrl.indexOf("?");
  const hash = rawUrl.indexOf("#");
  let end = rawUrl.length;
  if (question >= 0) end = Math.min(end, question);
  if (hash >= 0) end = Math.min(end, hash);
  const bare = rawUrl.slice(0, end);
  let decoded: string;
  try {
    decoded = decodeURIComponent(bare);
  } catch {
    return { kind: "forbidden" };
  }
  if (decoded.includes("\0")) return { kind: "forbidden" };
  const requested = decoded === "" || decoded === "/" ? "/index.html" : decoded;
  const rootResolved = path.resolve(root);
  const full = path.resolve(rootResolved, `.${requested.startsWith("/") ? requested : `/${requested}`}`);
  if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) return { kind: "forbidden" };

  if (await isFile(full)) return { kind: "file", file: full };

  const extension = path.extname(requested);
  if (extension) return { kind: "missing" };
  const index = path.join(rootResolved, "index.html");
  if (await isFile(index)) return { kind: "spa", file: index };
  return { kind: "missing" };
}

async function isFile(file: string): Promise<boolean> {
  try {
    const info = await stat(file);
    return info.isFile();
  } catch {
    return false;
  }
}

export function contentType(file: string): string {
  switch (path.extname(file).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
    case ".mjs":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".json":
    case ".map":
      return "application/json; charset=utf-8";
    case ".woff2":
      return "font/woff2";
    case ".woff":
      return "font/woff";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
