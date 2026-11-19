import { createServer } from "vite";
import { chokepointApiPlugin } from "./apiPlugin.js";

const server = await createServer({
  plugins: [chokepointApiPlugin()],
});
await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: false });
