import { STATUS_LABEL } from "../../lib/labels.js";
import type { PassageView } from "../../lib/types.js";

interface Props {
  passages: PassageView[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function StatusRail({ passages, selectedId, onSelect }: Props) {
  return (
    <div className="rail" role="group" aria-label="Passages">
      {passages.map((passage) => {
        const oil = passage.shares[0];
        const selected = passage.id === selectedId;
        return (
          <button
            key={passage.id}
            type="button"
            aria-pressed={selected}
            className={`rail-card status-${passage.status}${selected ? " is-selected" : ""}`}
            onClick={() => onSelect(passage.id)}
          >
            <span className={`status-word status-${passage.status}`}>{STATUS_LABEL[passage.status]}</span>
            <span className="rail-name">{passage.shortName}</span>
            {oil ? <span className="rail-stat">{oil.value}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
