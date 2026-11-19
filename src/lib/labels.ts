import type { PassageKind, Status } from "./types.js";

export const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  disrupted: "Disrupted",
  uncertain: "Uncertain",
};

export const KIND_LABEL: Record<PassageKind, string> = {
  strait: "Strait",
  canal: "Canal",
  route: "Alternative route",
};

export function modeLabel(mode: "fixture" | "mixed"): string {
  return mode === "fixture" ? "Fixture snapshot" : "Fixture + live feeds";
}
