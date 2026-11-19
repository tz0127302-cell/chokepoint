# Contributing

Thanks for looking. chokepoint is a small public-information project. The useful change is usually a clearer sentence, a better source, or a feed that is actually open.

## Ground rules

- Neutral language. Describe what a publisher reported. Do not add color, and do not write as if this repository confirmed an incident.
- No secrets, tokens, or paid-API keys. If a source needs a key, do not add it.
- No ship tracking, AIS, vessel positions, or incident coordinates. This is not a military, intelligence, or targeting tool.
- Headlines, links, dates, and short summaries only. Snippets in `data/snapshot.json` must stay under 400 characters. Do not paste articles.
- Do not scrape authenticated pages, paywalls, or sites whose terms forbid it. Official canal pages are linked, not harvested.
- The dashboard and CLI must keep working with the bundled fixture when the network is down.

## Setup

This package is not on npm. Clone https://github.com/tz0127302-cell/chokepoint.git and install in that directory.

```bash
git clone https://github.com/tz0127302-cell/chokepoint.git
cd chokepoint
npm install
npm test
npm run dev
```

The dev server is [http://127.0.0.1:4317](http://127.0.0.1:4317). `npm start` builds and serves the production bundle on port 4318.

CLI, before or after a build:

```bash
npm run chokepoint -- list
npm run chokepoint -- status hormuz
npm run chokepoint -- news --passage suez
npm run chokepoint -- update
```

`update` writes `data/cache/feeds.json`, which is gitignored.

## Adding a feed

Edit `data/feeds.json`. Use a public RSS, Atom, or the optional GDELT DOC endpoint. Set `"enabled": false` if the feed should stay off by default. GDELT is off because callers should accept GDELT’s own terms first.

Supported shapes are RSS 2.0 and Atom. RSS 1.0 is rejected on purpose.

## Updating the fixture

`data/snapshot.json` is the offline story. When you change a status, the fixture test checks that the status word still matches the keyword screen in `src/lib/status.ts`, applied to the fixture headlines, starting from `open`. Notes do not move status. If you disagree with the screen, change the rule and the tests together, and say why in the methodology copy.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

Status rules, feed parsing, the fixture, the CLI, and a static render of the dashboard are covered. Please extend the tests when you change a rule.

## Commits

[Conventional commits](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

One purpose per change is easier to review than a bundle of unrelated edits.
