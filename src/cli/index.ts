#!/usr/bin/env node
import { execute } from "./run.js";

const code = await execute(process.argv.slice(2), {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
  color: Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
});
process.exit(code);
