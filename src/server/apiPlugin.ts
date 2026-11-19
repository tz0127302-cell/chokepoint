import type { Connect, Plugin } from "vite";
import { dispatch } from "./handler.js";

function apiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api/")) {
      next();
      return;
    }
    void dispatch(req.method ?? "GET", url)
      .then((result) => {
        res.statusCode = result.status;
        for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
        res.end(result.body);
      })
      .catch(() => {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "Internal error" }));
      });
  };
}

export function chokepointApiPlugin(): Plugin {
  const middleware = apiMiddleware();
  return {
    name: "chokepoint-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
