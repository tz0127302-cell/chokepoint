import { DISCLAIMER } from "./disclaimer.js";
import { matchPassages } from "./match.js";
import { screenStatus } from "./status.js";
import type { Dataset, LiveBundle, NewsItem, Passage, PassageView, SnapshotFile } from "./types.js";
import { VERSION } from "./version.js";

const NEWS_CAP = 80;

function passageText(title: string, snippet: string): string {
  return `${title}\n${snippet}`;
}

function timeValue(iso: string | null): number {
  if (!iso) return Number.NEGATIVE_INFINITY;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

function toNews(item: {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  snippet: string;
  origin: NewsItem["origin"];
  kind: NewsItem["kind"];
}, passages: readonly Passage[]): NewsItem | null {
  const passageIds = matchPassages(passageText(item.title, item.snippet), passages);
  if (passageIds.length === 0) return null;
  return { ...item, passageIds };
}

export function buildDataset(input: {
  passages: readonly Passage[];
  snapshot: SnapshotFile;
  live?: LiveBundle | null;
  asOf?: Date;
}): Dataset {
  const asOf = input.asOf ?? new Date();
  const live = input.live ?? null;
  const fixtureNews: NewsItem[] = [];
  for (const item of input.snapshot.news) {
    const news = toNews(
      {
        id: item.id,
        title: item.title,
        url: item.url,
        publisher: item.publisher,
        publishedAt: item.publishedAt,
        snippet: item.snippet,
        origin: "fixture",
        kind: item.kind ?? "headline",
      },
      input.passages,
    );
    if (news) fixtureNews.push(news);
  }

  const liveNews: NewsItem[] = [];
  if (live) {
    for (const item of live.items) {
      const news = toNews(
        {
          id: item.id,
          title: item.title,
          url: item.url,
          publisher: item.publisher,
          publishedAt: item.publishedAt,
          snippet: item.snippet,
          origin: "live",
          kind: "headline",
        },
        input.passages,
      );
      if (news) liveNews.push(news);
    }
  }

  const seen = new Set<string>();
  const news: NewsItem[] = [];
  for (const item of [...liveNews, ...fixtureNews]) {
    const key = normalizeUrl(item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    news.push(item);
  }
  news.sort((a, b) => timeValue(b.publishedAt) - timeValue(a.publishedAt) || a.title.localeCompare(b.title));

  const passages: PassageView[] = input.passages.map((passage) => {
    const curated = input.snapshot.passages[passage.id];
    const baseline = curated?.status ?? "open";
    const baselineUpdated = curated?.updatedAt ?? input.snapshot.generatedAt;
    const summary =
      curated?.statusSummary ?? "No curated status was included for this passage in the bundled snapshot.";
    const liveItems = news.filter(
      (item) => item.origin === "live" && item.kind === "headline" && item.passageIds.includes(passage.id) && item.publishedAt,
    );
    const decision = screenStatus(
      baseline,
      liveItems.map((item) => ({
        text: passageText(item.title, item.snippet),
        publishedAt: item.publishedAt as string,
        passageId: passage.id,
      })),
      asOf,
    );
    const changed = decision.status !== baseline;
    return {
      id: passage.id,
      name: passage.name,
      shortName: passage.shortName,
      region: passage.region,
      kind: passage.kind,
      description: passage.description,
      whyItMatters: passage.whyItMatters,
      shares: passage.shares,
      sources: passage.sources,
      status: decision.status,
      baselineStatus: baseline,
      statusSummary: summary,
      statusReason: live
        ? decision.reason
        : "Curated in the bundled snapshot. No live headlines were applied.",
      updatedAt: changed && decision.latest ? decision.latest : baselineUpdated,
    };
  });

  return {
    version: VERSION,
    mode: live && liveNews.length > 0 ? "mixed" : "fixture",
    generatedAt: input.snapshot.generatedAt,
    liveFetchedAt: live?.fetchedAt ?? null,
    label: input.snapshot.label,
    about: input.snapshot.about,
    disclaimer: DISCLAIMER,
    passages,
    news: news.slice(0, NEWS_CAP),
    feeds: live?.feeds ?? null,
  };
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}
