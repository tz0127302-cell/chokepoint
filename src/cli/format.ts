import { formatUpdated, formatUtcDay } from "../lib/format.js";
import type { Dataset, FeedHealth, NewsItem, PassageView } from "../lib/types.js";

export function pad(value: string, width: number): string {
  if (value.length >= width) return value;
  return value + " ".repeat(width - value.length);
}

function paint(enabled: boolean, status: string): string {
  if (!enabled) return status;
  const code = status === "disrupted" ? "31" : status === "uncertain" ? "33" : "32";
  return `\u001b[${code}m${status}\u001b[0m`;
}

function colorStatus(enabled: boolean, status: string, width: number): string {
  const cell = pad(status, width);
  if (!enabled) return cell;
  return cell.replace(status, paint(true, status));
}

export function formatList(dataset: Dataset, color = false): string {
  const lines = [
    `chokepoint ${dataset.version}  ·  ${dataset.mode}  ·  snapshot ${formatUtcDay(dataset.generatedAt)}`,
    "",
    `${pad("ID", 16)}  ${pad("PASSAGE", 22)}  ${pad("STATUS", 12)}  UPDATED`,
  ];
  for (const passage of dataset.passages) {
    lines.push(
      `${pad(passage.id, 16)}  ${pad(passage.name, 22)}  ${colorStatus(color, passage.status, 12)}  ${formatUtcDay(passage.updatedAt)}`,
    );
  }
  lines.push("");
  lines.push(dataset.disclaimer);
  return lines.join("\n");
}

export function formatStatus(dataset: Dataset, passage: PassageView, news: NewsItem[], color = false): string {
  const lines = [
    passage.name,
    `status      ${paint(color, passage.status)}`,
    `baseline    ${passage.baselineStatus}`,
    `record      ${formatUpdated(passage.updatedAt)}`,
    `mode        ${dataset.mode}`,
    `region      ${passage.region}`,
    "",
    passage.statusSummary,
    "",
    "Why it matters",
    passage.whyItMatters,
    "",
    passage.description,
    "",
    "Published estimates",
    "These are not measurements for the status date. Each figure has its own as-of date.",
  ];
  for (const share of passage.shares) {
    lines.push(`- ${share.value} — ${share.label} (${share.asOf})`);
    lines.push(`  ${share.note}`);
    lines.push(`  ${share.sourceName}`);
    lines.push(`  ${share.sourceUrl}`);
  }
  lines.push("");
  lines.push("Standing sources");
  for (const source of passage.sources) {
    lines.push(`- ${source.publisher}: ${source.title}`);
    lines.push(`  ${source.url}`);
  }
  lines.push("");
  lines.push("Reporting");
  if (news.length === 0) {
    lines.push("No headline in this dataset is tagged to this passage.");
  }
  for (const item of news.slice(0, 5)) {
    lines.push(`- ${formatUtcDay(item.publishedAt)}  ${item.publisher}  ${item.origin}`);
    lines.push(`  ${item.title}`);
    if (item.snippet) lines.push(`  ${item.snippet}`);
    lines.push(`  ${item.url}`);
  }
  lines.push("");
  lines.push(dataset.disclaimer);
  return lines.join("\n");
}

export function formatNews(dataset: Dataset, news: NewsItem[]): string {
  if (news.length === 0) {
    return `No matching headlines.\n\n${dataset.disclaimer}`;
  }
  const lines: string[] = [];
  for (const item of news) {
    lines.push(`${formatUtcDay(item.publishedAt)}  ${item.publisher}  ${item.origin}${item.kind === "note" ? "  note" : ""}`);
    lines.push(item.title);
    if (item.snippet) lines.push(item.snippet);
    lines.push(item.url);
    lines.push(`passages: ${item.passageIds.join(", ")}`);
    lines.push("");
  }
  lines.push(dataset.disclaimer);
  return lines.join("\n");
}

export function formatUpdate(feeds: FeedHealth[], matched: number, mode: string, disclaimer: string): string {
  const lines = ["Public feeds", ""];
  if (feeds.length === 0) {
    lines.push("No cache and no feed response.");
  }
  for (const feed of feeds) {
    const state = feed.skipped ? "off" : feed.ok ? "ok" : feed.stale ? "stale" : "fail";
    const detail = feed.skipped ? "disabled" : feed.error ? feed.error : `${feed.items} headlines`;
    lines.push(`  ${pad(state, 6)}  ${pad(feed.publisher, 18)}  ${detail}`);
  }
  lines.push("");
  lines.push(`Matched headlines in the dataset: ${matched}`);
  lines.push(`Data mode: ${mode}`);
  lines.push("");
  lines.push(disclaimer);
  return lines.join("\n");
}
