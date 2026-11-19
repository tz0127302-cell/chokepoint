import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatUpdated } from "../../lib/format.js";
import { modeLabel } from "../../lib/labels.js";
import type { Dataset, FeedHealth } from "../../lib/types.js";
import { bundledDataset } from "../bundled.js";
import { Detail } from "../components/Detail.js";
import { NewsList } from "../components/NewsList.js";
import { Schematic } from "../components/Schematic.js";
import { StatusRail } from "../components/StatusRail.js";

interface ViewProps {
  dataset: Dataset;
  apiAvailable: boolean | null;
  refreshState: "idle" | "loading" | "done" | "error";
  refreshMessage: string | null;
  onRefresh: () => void;
}

function defaultPassageId(dataset: Dataset): string {
  const rank = { disrupted: 2, uncertain: 1, open: 0 } as const;
  const ranked = [...dataset.passages].sort((a, b) => rank[b.status] - rank[a.status]);
  return ranked[0]?.id ?? "hormuz";
}

export function DashboardView({ dataset, apiAvailable, refreshState, refreshMessage, onRefresh }: ViewProps) {
  const [params, setParams] = useSearchParams();
  const [newsMode, setNewsMode] = useState<"follow" | "all">("follow");
  const requested = params.get("passage");
  const selectedId =
    requested && dataset.passages.some((passage) => passage.id === requested)
      ? requested
      : defaultPassageId(dataset);
  const passage = dataset.passages.find((item) => item.id === selectedId) ?? dataset.passages[0];

  useEffect(() => {
    if (typeof document === "undefined" || !passage) return;
    document.title = `${passage.name} · chokepoint`;
  }, [passage]);

  if (!passage) {
    return <p className="empty">The snapshot did not include any passages.</p>;
  }

  const related = dataset.news.filter((item) => item.passageIds.includes(passage.id));

  function select(id: string): void {
    setNewsMode("follow");
    setParams({ passage: id });
  }

  return (
    <div className="dashboard">
      <div className="dateline">
        <p>
          <strong>{modeLabel(dataset.mode)}</strong>
          <span>Snapshot {formatUpdated(dataset.generatedAt)}</span>
          {dataset.liveFetchedAt ? <span>Feeds {formatUpdated(dataset.liveFetchedAt)}</span> : null}
          <span>{dataset.label}</span>
        </p>
        <button
          type="button"
          className="solid-button"
          onClick={onRefresh}
          disabled={apiAvailable !== true || refreshState === "loading"}
        >
          {refreshState === "loading" ? "Refreshing…" : "Refresh feeds"}
        </button>
      </div>
      {apiAvailable === false ? (
        <p className="fine">
          Showing the bundled fixture. Live refresh is available when you run <code>npm run dev</code> or{" "}
          <code>npm start</code>.
        </p>
      ) : null}
      {refreshMessage ? (
        <p className={refreshState === "error" ? "banner warn" : "banner"} role="status">
          {refreshMessage}
        </p>
      ) : null}
      <p className="lede">{dataset.about}</p>
      <StatusRail passages={dataset.passages} selectedId={passage.id} onSelect={select} />
      <Schematic passages={dataset.passages} selectedId={passage.id} onSelect={select} />
      <Detail dataset={dataset} passage={passage} news={related} />
      {dataset.feeds ? <FeedLine feeds={dataset.feeds} /> : null}
      <NewsList
        passages={dataset.passages}
        news={dataset.news}
        filter={passage.id}
        mode={newsMode}
        onFollow={() => setNewsMode("follow")}
        onAll={() => setNewsMode("all")}
      />
    </div>
  );
}

function FeedLine({ feeds }: { feeds: FeedHealth[] }) {
  return (
    <ul className="feed-line">
      {feeds.map((feed) => (
        <li key={feed.id}>
          <span>{feed.publisher}</span>
          <span>
            {feed.skipped ? "Off" : feed.ok ? "Responded" : feed.stale ? "Stale cache" : "No response"}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface RefreshBody {
  ok?: boolean;
  error?: string;
  dataset?: Dataset;
  refresh?: { feeds?: FeedHealth[] };
}

export function DashboardPage() {
  const [dataset, setDataset] = useState(bundledDataset);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [refreshState, setRefreshState] = useState<ViewProps["refreshState"]>("idle");
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dataset", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Dataset request failed");
        return (await response.json()) as Dataset;
      })
      .then((next) => {
        setDataset(next);
        setApiAvailable(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setApiAvailable(false);
      });
    return () => controller.abort();
  }, []);

  async function onRefresh(): Promise<void> {
    setRefreshState("loading");
    setRefreshMessage(null);
    try {
      const response = await fetch("/api/update", { method: "POST" });
      const body = (await response.json()) as RefreshBody;
      if (!response.ok || !body.dataset) throw new Error(body.error || "Refresh failed");
      setDataset(body.dataset);
      const feeds = body.refresh?.feeds ?? [];
      const enabled = feeds.filter((feed) => !feed.skipped);
      const failed = enabled.filter((feed) => !feed.ok && !feed.stale);
      if (enabled.length > 0 && enabled.every((feed) => !feed.ok)) {
        setRefreshState("error");
        setRefreshMessage("No public feed responded. Still showing the fixture and any cached headlines.");
        return;
      }
      if (failed.length > 0) {
        setRefreshState("done");
        setRefreshMessage(`Updated, with ${failed.length} feed${failed.length === 1 ? "" : "s"} unavailable.`);
        return;
      }
      setRefreshState("done");
      setRefreshMessage("Public feeds refreshed. Matched headlines are mixed with the fixture.");
    } catch {
      setRefreshState("error");
      setRefreshMessage("Refresh failed. The dataset on screen is unchanged.");
    }
  }

  return (
    <DashboardView
      dataset={dataset}
      apiAvailable={apiAvailable}
      refreshState={refreshState}
      refreshMessage={refreshMessage}
      onRefresh={() => void onRefresh()}
    />
  );
}
