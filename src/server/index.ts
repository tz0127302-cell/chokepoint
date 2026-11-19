#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { dispatch } from "./handler.js";
import { clientDir } from "./paths.js";
import { contentType, resolveStatic } from "./static.js";

const port = Number(process.env.PORT ?? 4318);
const host = process.env.HOST ?? "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be an integer between 1 and 65535.");
  process.exit(1);
}

const security: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
};

const server = createServer((req, res) => {
  void handle(req, res).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error(message);
    if (!res.headersSent) {
      res.writeHead(500, { ...security, "content-type": "application/json; charset=utf-8" });
    }
    res.end(JSON.stringify({ error: "Internal error" }));
  });
});

async function handle(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse): Promise<void> {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";
  if (url.startsWith("/api/")) {
    const result = await dispatch(method, url);
    res.writeHead(result.status, { ...security, ...result.headers });
    res.end(result.body);
    return;
  }
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { ...security, "content-type": "text/plain; charset=utf-8" });
    res.end("Method not allowed");
    return;
  }
  const resolved = await resolveStatic(clientDir(), url);
  if (resolved.kind === "forbidden") {
    res.writeHead(403, { ...security, "content-type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }
  if (resolved.kind === "missing") {
    res.writeHead(404, { ...security, "content-type": "text/plain; charset=utf-8" });
    res.end("Dashboard build not found. Run npm run build, then npm start.");
    return;
  }
  const body = await readFile(resolved.file);
  const asset = resolved.file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    ...security,
    "content-type": contentType(resolved.file),
    "cache-control": asset ? "public, max-age=31536000, immutable" : "no-cache",
  });
  res.end(method === "HEAD" ? undefined : body);
}

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
    process.exit(1);
  }
  console.error(error.message);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`chokepoint dashboard  http://127.0.0.1:${port}`);
});
