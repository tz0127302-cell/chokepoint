import type { Passage } from "./types.js";

export function normalizeQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolvePassage(query: string, passages: readonly Passage[]): Passage | undefined {
  const normalized = normalizeQuery(query);
  if (!normalized) return undefined;
  return passages.find((passage) => {
    const keys = [passage.id, passage.name, passage.shortName, ...passage.aliases].map(normalizeQuery);
    return keys.includes(normalized);
  });
}
