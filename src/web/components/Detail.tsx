import { KIND_LABEL, STATUS_LABEL, modeLabel } from "../../lib/labels.js";
import { formatUpdated, formatUtcDay } from "../../lib/format.js";
import type { Dataset, NewsItem, PassageView } from "../../lib/types.js";
import { FIGURES_CONSULTED } from "../../lib/passages.js";

interface Props {
  dataset: Dataset;
  passage: PassageView;
  news: NewsItem[];
}

export function Detail({ dataset, passage, news }: Props) {
  const newest = news.find((item) => item.publishedAt);
  return (
    <article className={`detail status-${passage.status}`} aria-labelledby="passage-title">
      <p className={`status-word status-${passage.status}`}>{STATUS_LABEL[passage.status]}</p>
      <h2 id="passage-title">{passage.name}</h2>
      <p className="region">
        {passage.region} · {KIND_LABEL[passage.kind]}
      </p>
      <dl className="facts">
        <div>
          <dt>Status record</dt>
          <dd>{formatUpdated(passage.updatedAt)}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{modeLabel(dataset.mode)}</dd>
        </div>
        {newest ? (
          <div>
            <dt>Newest headline</dt>
            <dd>{formatUtcDay(newest.publishedAt)}</dd>
          </div>
        ) : null}
      </dl>
      {passage.status !== passage.baselineStatus ? (
        <p className="delta">
          Fixture baseline was {passage.baselineStatus}. Live headlines moved it to {passage.status}.
        </p>
      ) : null}
      <p className="summary">{passage.statusSummary}</p>
      <details>
        <summary>How this status was set</summary>
        <p>{passage.statusReason}</p>
      </details>
      <div className="detail-split">
        <div>
          <h3>Where it sits</h3>
          <p>{passage.description}</p>
          <h3>Why it is watched</h3>
          <p>{passage.whyItMatters}</p>
          <h3>Reporting used here</h3>
          {news.length === 0 ? (
            <p className="fine">No headline in this dataset is tagged to this passage.</p>
          ) : (
            <ul className="mini-news">
              {news.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <p>
                    <time dateTime={item.publishedAt ?? undefined}>{formatUtcDay(item.publishedAt)}</time>
                    <span>{item.publisher}</span>
                    <span className="origin">{item.kind === "note" ? "Note" : item.origin}</span>
                  </p>
                  <a href={item.url} target="_blank" rel="noreferrer noopener">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Published estimates</h3>
          <p className="fine">
            These are not measurements for 16 November 2026. Each figure has its own as-of date. Public pages were
            consulted on {FIGURES_CONSULTED}.
          </p>
          <ul className="shares">
            {passage.shares.map((share) => (
              <li key={share.id}>
                <p className="share-value">{share.value}</p>
                <p className="share-label">{share.label}</p>
                <p className="share-asof">{share.asOf}</p>
                <p className="share-note">{share.note}</p>
                <a href={share.sourceUrl} target="_blank" rel="noreferrer noopener">
                  {share.sourceName}
                </a>
              </li>
            ))}
          </ul>
          <h3>Standing sources</h3>
          <ul className="sources">
            {passage.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer noopener">
                  {source.title}
                </a>
                <span>{source.publisher}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
