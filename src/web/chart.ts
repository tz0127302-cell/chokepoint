export interface ChartNode {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
  label: string;
}

export const SPINE_Y = 268;

export const CHART_NODES: ChartNode[] = [
  { id: "turkish", x: 214, y: 142, dx: -28, dy: 4, anchor: "end", label: "Turkish Straits" },
  { id: "hormuz", x: 692, y: 132, dx: 26, dy: 4, anchor: "start", label: "Hormuz" },
  { id: "suez", x: 356, y: SPINE_Y, dx: 0, dy: 36, anchor: "middle", label: "Suez" },
  { id: "bab-al-mandab", x: 528, y: SPINE_Y, dx: 20, dy: 28, anchor: "start", label: "Bab al-Mandab" },
  { id: "malacca", x: 848, y: SPINE_Y, dx: 0, dy: 36, anchor: "middle", label: "Malacca" },
  { id: "cape", x: 318, y: 438, dx: 0, dy: -28, anchor: "middle", label: "Cape of Good Hope" },
  { id: "panama", x: 168, y: 534, dx: 0, dy: -28, anchor: "middle", label: "Panama" },
];

export const CHART_ORDER = ["turkish", "suez", "bab-al-mandab", "hormuz", "malacca", "cape", "panama"];

export const SEA_LABELS: Array<{ text: string; x: number; y: number }> = [
  { text: "BLACK SEA", x: 214, y: 96 },
  { text: "GULF", x: 692, y: 92 },
  { text: "MEDITERRANEAN", x: 132, y: 248 },
  { text: "RED SEA", x: 442, y: 248 },
  { text: "ARABIAN SEA", x: 760, y: 248 },
  { text: "EAST ASIA", x: 930, y: 248 },
  { text: "ATLANTIC", x: 72, y: 566 },
  { text: "PACIFIC", x: 268, y: 566 },
];
