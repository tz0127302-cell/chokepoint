import { Command, CommanderError } from "commander";
import { readFile } from "node:fs/promises";
import { DISCLAIMER } from "../lib/disclaimer.js";
import { passages } from "../lib/passages.js";
import { resolvePassage } from "../lib/resolve.js";
import { assertFeeds } from "../lib/validate.js";
import { VERSION } from "../lib/version.js";
import { loadDataset } from "../server/load.js";
import { cachePath, feedsPath } from "../server/paths.js";
import { refreshFeeds } from "../server/refresh.js";
import { formatList, formatNews, formatStatus, formatUpdate } from "./format.js";

export interface IO {
  log: (message: string) => void;
  error: (message: string) => void;
  color?: boolean;
}

const consoleIO: IO = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
  color: false,
};

interface Globals {
  json?: boolean;
  fixture?: boolean;
}

function emit(io: IO, json: boolean, payload: unknown, text: string): void {
  io.log(json ? JSON.stringify(payload, null, 2) : text);
}

export async function execute(argv: string[], io: IO = consoleIO): Promise<number> {
  let exitCode = 0;
  const program = new Command();
  program
    .name("chokepoint")
    .description("Public status for maritime chokepoints. Unofficial. Not operational or financial advice.")
    .version(VERSION)
    .option("-j, --json", "print JSON")
    .option("--fixture", "ignore cached live headlines")
    .showHelpAfterError(false)
    .exitOverride();

  program.configureOutput({
    writeOut: (text) => io.log(text.replace(/\n$/, "")),
    writeErr: (text) => io.error(text.replace(/\n$/, "")),
  });

  program
    .command("list")
    .description("List the seven passages and their status")
    .action(async function (this: Command) {
      const opts = this.optsWithGlobals<Globals>();
      const dataset = await loadDataset({ fixtureOnly: Boolean(opts.fixture) });
      emit(io, Boolean(opts.json), dataset, formatList(dataset, Boolean(io.color) && !opts.json));
    });

  program
    .command("status")
    .description("Show one passage")
    .argument("<passage>", "id or name, for example hormuz")
    .action(async function (this: Command, query: string) {
      const opts = this.optsWithGlobals<Globals>();
      const passage = resolvePassage(query, passages);
      if (!passage) {
        io.error(`Unknown passage "${query}". Try: ${passages.map((item) => item.id).join(", ")}`);
        exitCode = 1;
        return;
      }
      const dataset = await loadDataset({ fixtureOnly: Boolean(opts.fixture) });
      const view = dataset.passages.find((item) => item.id === passage.id);
      if (!view) {
        io.error("Passage missing from dataset.");
        exitCode = 1;
        return;
      }
      const news = dataset.news.filter((item) => item.passageIds.includes(passage.id));
      emit(
        io,
        Boolean(opts.json),
        { disclaimer: dataset.disclaimer, mode: dataset.mode, passage: view, news },
        formatStatus(dataset, view, news, Boolean(io.color) && !opts.json),
      );
    });

  program
    .command("news")
    .description("List headlines tagged to a passage")
    .option("-p, --passage <id>", "filter to one passage")
    .option("-n, --limit <count>", "maximum headlines", "20")
    .action(async function (this: Command) {
      const opts = this.optsWithGlobals<Globals & { passage?: string; limit?: string }>();
      const limit = Number(opts.limit ?? "20");
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        io.error("--limit must be an integer from 1 to 100.");
        exitCode = 1;
        return;
      }
      if (opts.passage && !resolvePassage(opts.passage, passages)) {
        io.error(`Unknown passage "${opts.passage}". Try: ${passages.map((item) => item.id).join(", ")}`);
        exitCode = 1;
        return;
      }
      const dataset = await loadDataset({ fixtureOnly: Boolean(opts.fixture) });
      const filtered = dataset.news.filter((item) => {
        if (!opts.passage) return true;
        const passage = resolvePassage(opts.passage, passages);
        return passage ? item.passageIds.includes(passage.id) : false;
      });
      const news = filtered.slice(0, limit);
      emit(
        io,
        Boolean(opts.json),
        { disclaimer: dataset.disclaimer, mode: dataset.mode, news },
        formatNews(dataset, news),
      );
    });

  program
    .command("update")
    .description("Fetch public feeds into the local cache")
    .option("--offline", "do not use the network; report the cache")
    .action(async function (this: Command) {
      const opts = this.optsWithGlobals<Globals & { offline?: boolean }>();
      const feeds = assertFeeds(JSON.parse(await readFile(feedsPath(), "utf8")) as unknown);
      const refresh = await refreshFeeds({
        feeds,
        cachePath: cachePath(),
        offline: Boolean(opts.offline),
      });
      const dataset = await loadDataset({ fixtureOnly: Boolean(opts.fixture) });
      const matched = dataset.news.filter((item) => item.origin === "live").length;
      const payload = {
        disclaimer: DISCLAIMER,
        ok: refresh.ok,
        fromCacheOnly: refresh.fromCacheOnly,
        fetchedAt: refresh.fetchedAt,
        mode: dataset.mode,
        matched,
        feeds: refresh.feeds,
      };
      emit(io, Boolean(opts.json), payload, formatUpdate(refresh.feeds, matched, dataset.mode, DISCLAIMER));
      if (!refresh.ok) exitCode = 1;
    });

  program.addHelpText("after", `\nExamples:\n  chokepoint list\n  chokepoint status hormuz\n  chokepoint news --passage bab-al-mandab\n  chokepoint update\n\n${DISCLAIMER}\n`);

  if (argv.length === 0) {
    program.outputHelp();
    return 0;
  }

  try {
    await program.parseAsync(argv, { from: "user" });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === "commander.helpDisplayed" || error.code === "commander.version" || error.exitCode === 0) {
        return 0;
      }
      return error.exitCode || 1;
    }
    io.error(error instanceof Error ? error.message : "chokepoint failed");
    return 1;
  }
}
