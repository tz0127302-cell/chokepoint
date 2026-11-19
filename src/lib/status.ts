import type { Status } from "./types.js";

/** Keyword screen. Patterns are not global: RegExp.test must stay idempotent. */
export const DISRUPT_PATTERNS: readonly RegExp[] = [
  /\bnaval mines?\b/i,
  /\bmines?\b/i,
  /\bmined\b/i,
  /\bmissile\b/i,
  /\bdrone\b/i,
  /\battack(?:s|ed|ing)?\b/i,
  /\bstruck\b/i,
  /\bfired (?:on|upon|at)\b/i,
  /\bprojectile\b/i,
  /\bablaze\b/i,
  /\bon fire\b/i,
  /\bcaught fire\b/i,
  /\bfires?\b/i,
  /\bexplosion\b/i,
  /\bclosure\b/i,
  /\bclosed\b/i,
  /\bblockade\b/i,
  /\bblockaded\b/i,
  /\bsuspended\b/i,
  /\bhalted\b/i,
  /\bseized\b/i,
  /\bhijack(?:s|ed|ing)?\b/i,
];

export const UNCERTAIN_PATTERNS: readonly RegExp[] = [
  /\bunconfirmed\b/i,
  /\bconflicting\b/i,
  /\baccounts differ\b/i,
  /\bunclear\b/i,
  /\badvisory\b/i,
  /\bwarning\b/i,
  /\bwithdr(?:ew|awn|awal)\b/i,
  /\badvanced into\b/i,
  /\badvanced on\b/i,
  /\badvanced toward\b/i,
  /\bunder pressure\b/i,
  /\brestricted\b/i,
  /\brestrictions?\b/i,
  /\bdivert(?:s|ed|ing)?\b/i,
  /\brerout(?:e|es|ed|ing)\b/i,
  /\bthreat\b/i,
];

export const RESTORE_PATTERNS: readonly RegExp[] = [
  /\breturn(?:s|ed)? to\b/i,
  /\bresum(?:e|es|ed)\b/i,
  /\breopen(?:s|ed)?\b/i,
  /\bnormal operations\b/i,
  /\boperating normally\b/i,
];

export const CAPE_ROUTE_SHIFT =
  /\brerout\w*\b|\bdivert\w*\b|\baround the cape\b|\bcape route\b|\bvia the cape\b/i;

export const DEFAULT_WINDOW_DAYS = 14;

export interface TextFlags {
  disrupt: boolean;
  uncertain: boolean;
  restore: boolean;
}

export interface StatusSignal extends TextFlags {
  publishedAt: string;
}

export interface StatusDecision {
  status: Status;
  reason: string;
  latest: string | null;
}

function anyPattern(patterns: readonly RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyText(text: string, passageId: string): TextFlags {
  const disrupt = anyPattern(DISRUPT_PATTERNS, text);
  const restore = anyPattern(RESTORE_PATTERNS, text);
  const uncertain = anyPattern(UNCERTAIN_PATTERNS, text);
  if (passageId === "cape" && !disrupt && CAPE_ROUTE_SHIFT.test(text)) {
    return { disrupt: false, uncertain: false, restore: false };
  }
  return { disrupt, uncertain, restore };
}

export function inWindow(publishedAt: string, asOf: Date, windowDays = DEFAULT_WINDOW_DAYS): boolean {
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return false;
  const now = asOf.getTime();
  const futureSlack = 36 * 60 * 60 * 1000;
  if (published > now + futureSlack) return false;
  return now - published <= windowDays * 24 * 60 * 60 * 1000;
}

function latestActive(signals: StatusSignal[]): string | null {
  let latest: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;
  for (const signal of signals) {
    if (!signal.disrupt && !signal.uncertain && !signal.restore) continue;
    const ms = new Date(signal.publishedAt).getTime();
    if (Number.isNaN(ms) || ms < latestMs) continue;
    latestMs = ms;
    latest = signal.publishedAt;
  }
  return latest;
}

export function overlayStatus(baseline: Status, signals: StatusSignal[]): StatusDecision {
  const latest = latestActive(signals);
  if (signals.length === 0) {
    return {
      status: baseline,
      reason:
        "No in-window headline changed the baseline. Older items can still be listed, but they do not move status.",
      latest,
    };
  }

  const active = signals.filter((signal) => signal.disrupt || signal.uncertain || signal.restore);
  if (active.length === 0) {
    return {
      status: baseline,
      reason:
        "In-window headlines did not match a status rule. Language about ships using the Cape route does not mark the Cape as disrupted. The baseline stands.",
      latest,
    };
  }

  const disrupt = active.some((signal) => signal.disrupt);
  const restore = active.some((signal) => signal.restore);
  const uncertainOnly = active.some((signal) => signal.uncertain && !signal.disrupt && !signal.restore);
  const restoreAndUncertain = active.some((signal) => signal.restore && signal.uncertain && !signal.disrupt);

  if (disrupt && restore) {
    if (baseline === "disrupted") {
      return {
        status: "disrupted",
        reason:
          "In-window headlines contain both disruption and resumption language. The disrupted baseline stays in place, and the disagreement is left visible in the headlines.",
        latest,
      };
    }
    return {
      status: "uncertain",
      reason: "In-window headlines contain both disruption and resumption language, so the status is uncertain.",
      latest,
    };
  }

  if (disrupt) {
    return {
      status: "disrupted",
      reason:
        "At least one in-window headline matched disruption language. This is a screen for readers, not a confirmation.",
      latest,
    };
  }

  if (restoreAndUncertain) {
    return {
      status: "uncertain",
      reason: "In-window headlines mix resumption language with uncertainty, so the status is uncertain.",
      latest,
    };
  }

  if (uncertainOnly && !restore) {
    if (baseline === "disrupted") {
      return {
        status: "disrupted",
        reason:
          "The baseline stays disrupted. Newer headlines add uncertainty and do not clearly report a resumption.",
        latest,
      };
    }
    return {
      status: "uncertain",
      reason: "In-window headlines match uncertainty language and do not report a closure or a resumption.",
      latest,
    };
  }

  if (restore) {
    if (baseline === "disrupted") {
      return {
        status: "uncertain",
        reason:
          "Resumption language moved a disrupted baseline down one step. A single resumption headline does not clear it to open.",
        latest,
      };
    }
    if (baseline === "uncertain") {
      return {
        status: "open",
        reason: "Resumption language moved an uncertain baseline to open.",
        latest,
      };
    }
    return {
      status: "open",
      reason: "The baseline was open, and in-window headlines use resumption language.",
      latest,
    };
  }

  return {
    status: baseline,
    reason: "In-window headlines did not match a status rule. The baseline stands.",
    latest,
  };
}

export interface ScreenItem {
  text: string;
  publishedAt: string;
  passageId: string;
}

export function screenStatus(baseline: Status, items: ScreenItem[], asOf: Date, windowDays = DEFAULT_WINDOW_DAYS): StatusDecision {
  const signals = items
    .filter((item) => inWindow(item.publishedAt, asOf, windowDays))
    .map((item) => ({
      ...classifyText(item.text, item.passageId),
      publishedAt: item.publishedAt,
    }));
  return overlayStatus(baseline, signals);
}
