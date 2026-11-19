import { XMLParser } from "fast-xml-parser";
import type { ParsedItem } from "./types.js";
import { htmlToText, stableId, toSnippet } from "./text.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: "#cdata",
  trimValues: true,
  processEntities: true,
  removeNSPrefix: true,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function textOf(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!isRecord(node)) return "";
  if (typeof node["#cdata"] === "string") return node["#cdata"];
  if (typeof node["#text"] === "string" || typeof node["#text"] === "number") return String(node["#text"]);
  return "";
}

export function linkOf(node: unknown): string {
  if (typeof node === "string") return node.trim();
  if (Array.isArray(node)) {
    const alternate = node.find((entry) => isRecord(entry) && entry["@_rel"] === "alternate");
    return linkOf(alternate ?? node[0]);
  }
  if (isRecord(node)) {
    if (typeof node["@_href"] === "string") return node["@_href"].trim();
    return textOf(node).trim();
  }
  return "";
}

export function parseDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const gdelt = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(trimmed);
  const normalized = gdelt
    ? `${gdelt[1]}-${gdelt[2]}-${gdelt[3]}T${gdelt[4]}:${gdelt[5]}:${gdelt[6]}Z`
    : trimmed;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function cleanTitle(value: string): string {
  return htmlToText(value);
}

function itemFrom(parts: {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  snippetSource: string;
  guid?: string;
}): ParsedItem | null {
  const title = cleanTitle(parts.title);
  const url = parts.url.trim();
  if (!title || !url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return {
    id: stableId(url || parts.guid || title),
    title,
    url,
    publisher: parts.publisher,
    publishedAt: parts.publishedAt,
    snippet: toSnippet(parts.snippetSource || ""),
  };
}

function parseRss(rss: unknown, publisher: string): ParsedItem[] {
  if (!isRecord(rss)) throw new Error("RSS document is missing a channel");
  const channel = isRecord(rss.channel) ? rss.channel : null;
  if (!channel) throw new Error("RSS channel is missing");
  const feedTitle = cleanTitle(textOf(channel.title));
  const source = publisher || feedTitle || "RSS";
  const items: ParsedItem[] = [];
  for (const raw of asArray(channel.item)) {
    if (!isRecord(raw)) continue;
    const snippetSource = textOf(raw.description) || textOf(raw["content:encoded"]) || textOf(raw.encoded) || "";
    const item = itemFrom({
      title: textOf(raw.title),
      url: linkOf(raw.link),
      publisher: source,
      publishedAt: parseDate(textOf(raw.pubDate) || textOf(raw.date) || ""),
      snippetSource,
      guid: textOf(raw.guid),
    });
    if (item) items.push(item);
  }
  return dedupe(items);
}

function parseAtom(feed: unknown, publisher: string): ParsedItem[] {
  if (!isRecord(feed)) throw new Error("Atom feed is missing");
  const feedTitle = cleanTitle(textOf(feed.title));
  const source = publisher || feedTitle || "Atom";
  const items: ParsedItem[] = [];
  for (const raw of asArray(feed.entry)) {
    if (!isRecord(raw)) continue;
    const snippetSource = textOf(raw.summary) || textOf(raw.content) || "";
    const published = textOf(raw.published) || textOf(raw.updated) || "";
    const item = itemFrom({
      title: textOf(raw.title),
      url: linkOf(raw.link),
      publisher: source,
      publishedAt: parseDate(published),
      snippetSource,
      guid: textOf(raw.id),
    });
    if (item) items.push(item);
  }
  return dedupe(items);
}

function dedupe(items: ParsedItem[]): ParsedItem[] {
  const seen = new Set<string>();
  const result: ParsedItem[] = [];
  for (const item of items) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    result.push(item);
  }
  return result;
}

export function parseFeed(xml: string, publisher: string): ParsedItem[] {
  let doc: unknown;
  try {
    doc = parser.parse(xml);
  } catch {
    throw new Error("Feed XML could not be parsed");
  }
  if (!isRecord(doc)) throw new Error("Unrecognized feed format");
  if ("rss" in doc) return parseRss(doc.rss, publisher);
  if ("feed" in doc) return parseAtom(doc.feed, publisher);
  if ("RDF" in doc) throw new Error("RSS 1.0 is not supported");
  throw new Error("Unrecognized feed format");
}

export function parseGdelt(body: string, publisher: string): ParsedItem[] {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error("GDELT response was not JSON");
  }
  if (!isRecord(data) || !Array.isArray(data.articles)) return [];
  const items: ParsedItem[] = [];
  for (const raw of data.articles) {
    if (!isRecord(raw)) continue;
    const domain = typeof raw.domain === "string" ? raw.domain : "gdelt";
    const seen = typeof raw.seendate === "string" ? raw.seendate : "";
    const item = itemFrom({
      title: typeof raw.title === "string" ? raw.title : "",
      url: typeof raw.url === "string" ? raw.url : "",
      publisher: publisher || "GDELT",
      publishedAt: parseDate(seen),
      snippetSource: `Headline only. GDELT DOC record from ${domain}.`,
    });
    if (item) items.push(item);
  }
  return dedupe(items);
}
