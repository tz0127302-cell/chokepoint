import { useEffect } from "react";
import feedsJson from "../../../data/feeds.json";
import { METHODOLOGY } from "../../lib/methodology.js";
import { passages } from "../../lib/passages.js";
import type { FeedConfig, SourceLink } from "../../lib/types.js";

const feeds = feedsJson as FeedConfig[];

function standingSources(): SourceLink[] {
  const seen = new Set<string>();
  const sources: SourceLink[] = [];
  for (const passage of passages) {
    for (const source of passage.sources) {
      if (seen.has(source.url)) continue;
      seen.add(source.url);
      sources.push(source);
    }
  }
  return sources;
}

export function MethodologyPage() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = "Methodology · chokepoint";
  }, []);
  const sources = standingSources();

  return (
    <article className="method">
      <p className="kicker">How to read this</p>
      <h2>Methodology</h2>
      <p className="lede">
        The status on the front page is a reading of public reporting and published statistics. It is not a notice
        to mariners and not a market call.
      </p>
      {METHODOLOGY.map((section) => (
        <section key={section.id} id={section.id}>
          <h3>{section.title}</h3>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
      <section id="sources">
        <h3>Standing sources</h3>
        <ul className="sources">
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer noopener">
                {source.title}
              </a>
              <span>{source.publisher}</span>
            </li>
          ))}
        </ul>
      </section>
      <section id="feeds">
        <h3>Feeds the updater will request</h3>
        <p>Only these URLs are fetched, and only when you ask. Disabled feeds are skipped.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Publisher</th>
                <th>Kind</th>
                <th>State</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {feeds.map((feed) => (
                <tr key={feed.id}>
                  <td>
                    <a href={feed.url} target="_blank" rel="noreferrer noopener">
                      {feed.publisher}
                    </a>
                  </td>
                  <td>{feed.kind === "gdelt" ? "GDELT API" : "RSS/Atom"}</td>
                  <td>{feed.enabled ? "On" : "Off"}</td>
                  <td>{feed.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
