import { formatUtcDay } from "../../lib/format.js";
import { STATUS_LABEL } from "../../lib/labels.js";
import type { NewsItem, PassageView } from "../../lib/types.js";

interface Props {
  passages: PassageView[];
  news: NewsItem[];
  filter: string;
  mode: "follow" | "all";
  onFollow: () => void;
  onAll: () => void;
}

export function NewsList({ passages, news, filter, mode, onFollow, onAll }: Props) {
  const visible =
    mode === "all" || filter === "all" ? news : news.filter((item) => item.passageIds.includes(filter));
  const active = passages.find((passage) => passage.id === filter);
  return (
    <section className="news" aria-labelledby="news-title">
      <div className="news-head">
        <h2 id="news-title">Public reporting</h2>
        <p>Headlines, links, and short summaries. Read the piece at the publisher.</p>
      </div>
      <div className="filters" role="group" aria-label="Filter headlines">
        <button type="button" aria-pressed={mode === "all"} onClick={onAll}>
          All
        </button>
        <button type="button" aria-pressed={mode === "follow"} onClick={onFollow}>
          This passage{active && mode === "follow" ? ` · ${active.shortName}` : ""}
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="empty">
          No headline in this view is tagged
          {active && mode === "follow" ? ` to ${active.name}` : ""}. Feeds are a sample, not a full record.
        </p>
      ) : (
        <ol>
          {visible.map((item) => (
            <li key={item.id}>
              <div className="news-meta">
                <time dateTime={item.publishedAt ?? undefined}>{formatUtcDay(item.publishedAt)}</time>
                <span>{item.publisher}</span>
                <span className="origin">{item.kind === "note" ? "Note" : item.origin === "live" ? "Live" : "Fixture"}</span>
              </div>
              <div>
                <a href={item.url} target="_blank" rel="noreferrer noopener">
                  {item.title}
                </a>
                {item.snippet ? <p>{item.snippet}</p> : null}
                <p className="tags">
                  {item.passageIds.map((id) => {
                    const passage = passages.find((candidate) => candidate.id === id);
                    if (!passage) return null;
                    return (
                      <span key={id} className={`tag status-${passage.status}`}>
                        {passage.shortName}
                        <span className="sr-only"> {STATUS_LABEL[passage.status]}</span>
                      </span>
                    );
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
