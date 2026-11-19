import snapshotJson from "../../data/snapshot.json";
import { buildDataset } from "../lib/dataset.js";
import { passages } from "../lib/passages.js";
import { assertSnapshot } from "../lib/validate.js";

const snapshot = assertSnapshot(
  snapshotJson,
  passages.map((passage) => passage.id),
);

export const bundledDataset = buildDataset({
  passages,
  snapshot,
  live: null,
  asOf: new Date(snapshot.generatedAt),
});
