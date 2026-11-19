export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function includesTerm(haystack: string, term: string): boolean {
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?:[^a-z0-9]|$)`);
  return pattern.test(haystack);
}

export function matchPassages(
  text: string,
  passages: ReadonlyArray<{ id: string; keywords: readonly string[] }>,
): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const passage of passages) {
    const matched = passage.keywords.some((keyword) => includesTerm(haystack, keyword.toLowerCase()));
    if (matched) hits.push(passage.id);
  }
  return hits;
}
