export interface MethodologySection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const METHODOLOGY: MethodologySection[] = [
  {
    id: "what",
    title: "What this is",
    paragraphs: [
      "chokepoint is a public reading list for seven sea passages that carry a large share of oil, gas, or containers. It pairs a short status word with the headlines and the published statistics behind that word.",
      "The status words are open, disrupted, and uncertain. There is no score, rank, or forecast.",
    ],
  },
  {
    id: "not",
    title: "What this is not",
    paragraphs: [
      "This is not a government, canal-authority, or company notice. It is not navigational, operational, or financial advice. Nothing here is a recommendation to sail, insure, buy, or sell.",
      "It is not a ship tracker and not a military, intelligence, or targeting tool. The project does not collect AIS, vessel positions, or incident coordinates. The diagram is a schematic drawn for this repository. It is not a chart and not for navigation.",
    ],
  },
  {
    id: "passages",
    title: "The seven passages",
    paragraphs: [
      "The set is the Strait of Hormuz, Bab al-Mandab, the Suez Canal, the Panama Canal, the Strait of Malacca, the Turkish Straits, and the Cape of Good Hope. The Cape is included because it is the long alternative when the Red Sea route is unattractive. It is not a narrow strait, and it does not bypass Hormuz.",
    ],
  },
  {
    id: "rules",
    title: "How status is set",
    paragraphs: [
      "The bundled snapshot is an editorial reading of public reporting, dated 16 November 2026. It was checked against the keyword screen below, starting from open, using only the fixture headlines. Notes do not move status.",
      "Live headlines can raise a status as soon as they match disruption or uncertainty language. They can lower a status only one step, and only on resumption language with no disruption language. One resumption headline does not move disrupted to open.",
      "If the same 14-day window contains both disruption and resumption language, a disrupted baseline stays disrupted. Any other baseline becomes uncertain. Headlines older than 14 days stay on screen and do not move status.",
      "Headlines that do not name a tracked passage are dropped. Language about ships using the Cape does not mark the Cape as disrupted.",
      "The screen is a keyword list. It will misfire. The headline is shown so a person can overrule it. A status is not a confirmation that an incident happened, and it is not a measurement of how much oil is moving.",
    ],
    bullets: [
      "Disruption language includes mines, fires, attacks, projectiles, missiles, closures, blockades, and halted transit.",
      "Uncertainty language includes withdrawals, unconfirmed or conflicting accounts, restrictions, advisories, and rerouting.",
      "Resumption language includes reopened, resumed, and returned to a canal.",
    ],
  },
  {
    id: "fixture",
    title: "Fixture and live data",
    paragraphs: [
      "data/snapshot.json is shipped with the repository so the dashboard and the CLI work with no network. The interface says when you are looking at that fixture.",
      "chokepoint update, and the Refresh feeds button, fetch only the public URLs in data/feeds.json. The request runs on your machine. The browser does not call news sites. Fonts are bundled.",
      "A feed that fails keeps its previous cache and is marked stale. If every feed fails, the fixture remains. GDELT DOC is implemented, needs no key, and is off by default.",
      "The Suez Canal Authority and the Panama Canal Authority publish public pages. Those pages are linked. Their HTML is not scraped. Authenticated and paywalled sites are not fetched.",
    ],
  },
  {
    id: "figures",
    title: "How to read the figures",
    paragraphs: [
      "Oil volumes are the U.S. Energy Information Administration’s published chokepoint table through the first half of 2025. They are not a reading for 16 November 2026. EIA attributes the table to its February 2026 Short-Term Energy Outlook and to tanker-tracking analysis.",
      "Trade and container shares are mostly from UNCTAD’s Review of Maritime Transport 2024 and refer to 2023 unless a note says otherwise. LNG through Hormuz follows the IEA’s description of 2025 exports. Where two public figures differ, both are shown rather than averaged.",
    ],
  },
  {
    id: "copy",
    title: "Headlines, copyright, and privacy",
    paragraphs: [
      "The project stores headlines, links, dates, and short summaries. It does not store full articles. Do not add long copyrighted text to the snapshot. Publisher names are for attribution. Trademarks belong to their owners.",
      "There is no account, no analytics, and no cookie set by this project. The theme choice is stored in localStorage on your machine.",
    ],
  },
];
