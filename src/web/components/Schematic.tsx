import type { KeyboardEvent } from "react";
import { CHART_NODES, CHART_ORDER, SEA_LABELS, SPINE_Y } from "../chart.js";
import { STATUS_LABEL } from "../../lib/labels.js";
import type { PassageView } from "../../lib/types.js";

interface Props {
  passages: PassageView[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function Schematic({ passages, selectedId, onSelect }: Props) {
  const byId = new Map(passages.map((passage) => [passage.id, passage]));
  const bab = CHART_NODES.find((node) => node.id === "bab-al-mandab");
  const cape = CHART_NODES.find((node) => node.id === "cape");
  const turkish = CHART_NODES.find((node) => node.id === "turkish");
  const hormuz = CHART_NODES.find((node) => node.id === "hormuz");

  function move(id: string, direction: 1 | -1): void {
    const index = CHART_ORDER.indexOf(id);
    if (index < 0) return;
    const next = CHART_ORDER[(index + direction + CHART_ORDER.length) % CHART_ORDER.length] ?? id;
    onSelect(next);
    if (typeof document === "undefined") return;
    document.getElementById(`node-${next}`)?.focus();
  }

  function onKey(event: KeyboardEvent<SVGGElement>, id: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(id);
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(id, 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(id, -1);
    }
  }

  return (
    <figure className="chart-card">
      <figcaption>
        <span>Schematic passage diagram</span>
        <span>Not to scale · not for navigation</span>
      </figcaption>
      <div className="chart-scroll">
        <svg viewBox="0 0 1000 610" role="group" aria-label="Schematic of seven maritime passages">
          <ellipse className="land" cx="190" cy="168" rx="108" ry="58" />
          <ellipse className="land" cx="760" cy="168" rx="96" ry="52" />
          <ellipse className="land" cx="250" cy="390" rx="120" ry="62" />
          <ellipse className="land" cx="910" cy="210" rx="58" ry="40" />
          <rect className="inset" x="36" y="492" width="286" height="92" rx="10" />

          <path className="lane" d={`M 64 ${SPINE_Y} H 970`} />
          {turkish ? <path className="lane branch" d={`M ${turkish.x} ${turkish.y} V ${SPINE_Y}`} /> : null}
          {hormuz ? <path className="lane branch" d={`M ${hormuz.x} ${hormuz.y} V ${SPINE_Y}`} /> : null}
          {bab && cape ? (
            <path className="lane alt" d={`M ${bab.x} ${bab.y + 18} V ${cape.y} H 88 V ${SPINE_Y + 16}`} />
          ) : null}
          <path className="lane americas" d="M 58 534 H 286" />

          <g className="rose" transform="translate(48 48)" aria-hidden="true">
            <circle r="15" />
            <path d="M0 -13 L3.2 0 L0 13 L-3.2 0 Z" />
            <path d="M-13 0 L0 -3.2 L13 0 L0 3.2 Z" />
            <text y="-20">N</text>
          </g>

          {SEA_LABELS.map((label) => (
            <text key={label.text} className="sea-label" x={label.x} y={label.y} textAnchor="middle" fontSize="13">
              {label.text}
            </text>
          ))}

          {CHART_NODES.map((node) => {
            const passage = byId.get(node.id);
            if (!passage) return null;
            const selected = passage.id === selectedId;
            return (
              <g
                key={node.id}
                id={`node-${node.id}`}
                className={`node status-${passage.status}${selected ? " is-selected" : ""}`}
                transform={`translate(${node.x} ${node.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${passage.name}, ${STATUS_LABEL[passage.status]}`}
                aria-pressed={selected}
                onClick={() => onSelect(passage.id)}
                onKeyDown={(event) => onKey(event, passage.id)}
              >
                <circle className="focus-ring" r="24" />
                <circle className="node-fill" r="16" />
                <circle className="node-ring" r="16" />
                <circle className="node-core" r="3.4" />
                <text className="node-label" x={node.dx} y={node.dy} textAnchor={node.anchor} fontSize="16">
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="legend">
        <li>
          <i className="swatch status-disrupted" /> Disrupted
        </li>
        <li>
          <i className="swatch status-uncertain" /> Uncertain
        </li>
        <li>
          <i className="swatch status-open" /> Open
        </li>
        <li>
          <i className="legend-line" /> Primary lane
        </li>
        <li>
          <i className="legend-line alt" /> Alternative route
        </li>
      </ul>
    </figure>
  );
}
