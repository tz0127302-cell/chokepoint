export type Status = "open" | "disrupted" | "uncertain";

export type PassageKind = "strait" | "canal" | "route";

export interface ShareEstimate {
  id: string;
  value: string;
  label: string;
  asOf: string;
  note: string;
  sourceName: string;
  sourceUrl: string;
}

export interface SourceLink {
  title: string;
  url: string;
  publisher: string;
}

export interface Passage {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  keywords: string[];
  region: string;
  kind: PassageKind;
  description: string;
  whyItMatters: string;
  shares: ShareEstimate[];
  sources: SourceLink[];
}

export interface SnapshotPassage {
  status: Status;
  updatedAt: string;
  statusSummary: string;
}

export interface SnapshotNews {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  snippet: string;
  passageIds: string[];
  kind?: "headline" | "note";
}

export interface SnapshotFile {
  kind: "fixture";
  generatedAt: string;
  label: string;
  about: string;
  passages: Record<string, SnapshotPassage>;
  news: SnapshotNews[];
}

export type NewsOrigin = "fixture" | "live";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  snippet: string;
  passageIds: string[];
  origin: NewsOrigin;
  kind: "headline" | "note";
}

export interface FeedConfig {
  id: string;
  publisher: string;
  url: string;
  kind: "rss" | "atom" | "gdelt";
  enabled: boolean;
  notes?: string;
}

export interface FeedHealth {
  id: string;
  publisher: string;
  url: string;
  ok: boolean;
  stale: boolean;
  skipped: boolean;
  items: number;
  error: string | null;
}

export interface PassageView {
  id: string;
  name: string;
  shortName: string;
  region: string;
  kind: PassageKind;
  description: string;
  whyItMatters: string;
  shares: ShareEstimate[];
  sources: SourceLink[];
  status: Status;
  baselineStatus: Status;
  statusSummary: string;
  statusReason: string;
  updatedAt: string;
}

export interface Dataset {
  version: string;
  mode: "fixture" | "mixed";
  generatedAt: string;
  liveFetchedAt: string | null;
  label: string;
  about: string;
  disclaimer: string;
  passages: PassageView[];
  news: NewsItem[];
  feeds: FeedHealth[] | null;
}

export interface ParsedItem {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  snippet: string;
}

export interface LiveBundle {
  fetchedAt: string;
  items: ParsedItem[];
  feeds: FeedHealth[];
}
