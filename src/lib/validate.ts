import type { FeedConfig, SnapshotFile, SnapshotNews, Status } from "./types.js";

const STATUSES = new Set<Status>(["open", "disrupted", "uncertain"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value.trim();
}

function assertHttpUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} must use http or https`);
  }
  if (url.username || url.password) {
    throw new Error(`${label} must not include credentials`);
  }
  return value;
}

export function assertSnapshot(value: unknown, knownIds: readonly string[]): SnapshotFile {
  if (!isRecord(value)) throw new Error("Snapshot must be an object");
  if (value.kind !== "fixture") throw new Error("Snapshot kind must be fixture");
  const generatedAt = requireString(value.generatedAt, "generatedAt");
  if (Number.isNaN(new Date(generatedAt).getTime())) throw new Error("generatedAt is not a date");
  const label = requireString(value.label, "label");
  const about = requireString(value.about, "about");
  if (!isRecord(value.passages)) throw new Error("Snapshot passages must be an object");

  const known = new Set(knownIds);
  const passages: SnapshotFile["passages"] = {};
  for (const [id, raw] of Object.entries(value.passages)) {
    if (!known.has(id)) throw new Error(`Unknown passage in snapshot: ${id}`);
    if (!isRecord(raw)) throw new Error(`Passage ${id} must be an object`);
    const status = raw.status;
    if (typeof status !== "string" || !STATUSES.has(status as Status)) {
      throw new Error(`Passage ${id} has an invalid status`);
    }
    const updatedAt = requireString(raw.updatedAt, `${id}.updatedAt`);
    if (Number.isNaN(new Date(updatedAt).getTime())) throw new Error(`${id}.updatedAt is not a date`);
    const statusSummary = requireString(raw.statusSummary, `${id}.statusSummary`);
    passages[id] = { status: status as Status, updatedAt, statusSummary };
  }

  if (!Array.isArray(value.news)) throw new Error("Snapshot news must be an array");
  const news: SnapshotNews[] = value.news.map((item, index) => assertNews(item, index, known));

  return { kind: "fixture", generatedAt, label, about, passages, news };
}

function assertNews(value: unknown, index: number, known: Set<string>): SnapshotNews {
  const label = `news[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  const id = requireString(value.id, `${label}.id`);
  const title = requireString(value.title, `${label}.title`);
  if (title.length > 220) throw new Error(`${label} title is too long`);
  const url = assertHttpUrl(requireString(value.url, `${label}.url`), `${label}.url`);
  const publisher = requireString(value.publisher, `${label}.publisher`);
  if (publisher.length > 80) throw new Error(`${label} publisher is too long`);
  const publishedAt = requireString(value.publishedAt, `${label}.publishedAt`);
  if (Number.isNaN(new Date(publishedAt).getTime())) throw new Error(`${label}.publishedAt is not a date`);
  const snippet = requireString(value.snippet, `${label}.snippet`);
  if (snippet.length > 400) throw new Error(`${label} snippet is too long`);
  if (!Array.isArray(value.passageIds) || value.passageIds.length === 0) {
    throw new Error(`${label}.passageIds must be a non-empty array`);
  }
  const passageIds = value.passageIds.map((passageId, passageIndex) => {
    if (typeof passageId !== "string" || !known.has(passageId)) {
      throw new Error(`${label}.passageIds[${passageIndex}] is unknown`);
    }
    return passageId;
  });
  const kind = value.kind === undefined ? "headline" : value.kind;
  if (kind !== "headline" && kind !== "note") throw new Error(`${label}.kind is invalid`);
  return { id, title, url, publisher, publishedAt, snippet, passageIds, kind };
}

export function assertFeeds(value: unknown): FeedConfig[] {
  if (!Array.isArray(value)) throw new Error("feeds.json must be an array");
  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Feed ${index} must be an object`);
    const id = requireString(item.id, `feeds[${index}].id`);
    const publisher = requireString(item.publisher, `feeds[${index}].publisher`);
    const url = assertHttpUrl(requireString(item.url, `feeds[${index}].url`), `feeds[${index}].url`);
    const kind = item.kind;
    if (kind !== "rss" && kind !== "atom" && kind !== "gdelt") {
      throw new Error(`feeds[${index}].kind is invalid`);
    }
    const enabled = item.enabled === undefined ? true : item.enabled;
    if (typeof enabled !== "boolean") throw new Error(`feeds[${index}].enabled must be boolean`);
    const notes = item.notes === undefined ? undefined : requireString(item.notes, `feeds[${index}].notes`);
    return { id, publisher, url, kind, enabled, notes };
  });
}
