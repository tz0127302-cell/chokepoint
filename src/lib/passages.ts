import type { Passage, SourceLink } from "./types.js";

const EIA_CHOKEPOINTS: SourceLink = {
  title: "World Oil Transit Chokepoints",
  url: "https://www.eia.gov/international/content/analysis/special_topics/world_oil_transit_chokepoints/",
  publisher: "U.S. Energy Information Administration",
};

const UNCTAD_RMT: SourceLink = {
  title: "Review of Maritime Transport 2024",
  url: "https://unctad.org/system/files/official-document/rmt2024_en.pdf",
  publisher: "UNCTAD",
};

const UNCTAD_BRIEF: SourceLink = {
  title: "Navigating troubled waters (February 2024)",
  url: "https://unctad.org/system/files/official-document/osginf2024d2_en.pdf",
  publisher: "UNCTAD",
};

const IEA_HORMUZ: SourceLink = {
  title: "Strait of Hormuz: Oil and LNG Trade Facts",
  url: "https://www.iea.org/about/oil-security-and-emergency-response/strait-of-hormuz",
  publisher: "International Energy Agency",
};

const EIA_RED_SEA: SourceLink = {
  title: "Fewer tankers transit the Red Sea in 2024",
  url: "https://www.eia.gov/todayinenergy/detail.php?id=63446",
  publisher: "U.S. Energy Information Administration",
};

export const FIGURES_CONSULTED = "16 November 2026";

export const passages: Passage[] = [
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    shortName: "Hormuz",
    aliases: ["hormuz", "strait of hormuz"],
    keywords: ["strait of hormuz", "hormuz"],
    region: "Between Oman and Iran",
    kind: "strait",
    description:
      "The Strait of Hormuz links the Persian Gulf with the Gulf of Oman and the Arabian Sea. It is deep enough for the largest crude carriers. Public pipelines in Saudi Arabia and the United Arab Emirates can move only a portion of Gulf exports around it.",
    whyItMatters:
      "It is the main sea exit for Gulf oil and for LNG from Qatar and the UAE. A ship that cannot use Hormuz cannot switch to the Cape of Good Hope: the cargo still has to leave the Gulf. EIA describes the strait as carrying about a fifth of global petroleum liquids consumption.",
    shares: [
      {
        id: "oil",
        value: "20.9 million b/d",
        label: "Oil and petroleum liquids",
        asOf: "First half of 2025",
        note: "EIA’s chokepoint table. EIA describes this as about 20% of global petroleum liquids consumption. The 2023 figure in the same table is 21.8 million b/d, and 2024 is 20.7.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
      {
        id: "lng",
        value: "Almost 20% of LNG trade",
        label: "Liquefied natural gas",
        asOf: "2025, as described by the IEA",
        note: "The IEA says about 93% of Qatar’s LNG and 96% of the UAE’s LNG exports transit the strait, together almost 20% of global LNG trade, a bit over 112 bcm in 2025. UNCTAD’s 2024 review put Hormuz natural gas at 19% of global seaborne natural-gas volume in 2023.",
        sourceName: "IEA, Strait of Hormuz: Oil and LNG Trade Facts",
        sourceUrl: IEA_HORMUZ.url,
      },
      {
        id: "trade",
        value: "11.1% of seaborne trade",
        label: "All seaborne trade by volume",
        asOf: "2023",
        note: "UNCTAD’s Review of Maritime Transport 2024. The same table lists 39% of seaborne crude oil and 20% of seaborne oil products. Container traffic is not the main exposure.",
        sourceName: "UNCTAD, Review of Maritime Transport 2024",
        sourceUrl: UNCTAD_RMT.url,
      },
    ],
    sources: [
      EIA_CHOKEPOINTS,
      IEA_HORMUZ,
      UNCTAD_RMT,
      {
        title: "United Kingdom Maritime Trade Operations",
        url: "https://www.ukmto.org/",
        publisher: "UKMTO",
      },
    ],
  },
  {
    id: "bab-al-mandab",
    name: "Bab al-Mandab",
    shortName: "Bab al-Mandab",
    aliases: ["bab al mandab", "bab el mandeb", "bab el-mandeb", "mandab", "mandeb"],
    keywords: [
      "bab al-mandab",
      "bab al mandab",
      "bab el-mandeb",
      "bab el mandeb",
      "bab-el-mandeb",
      "perim island",
    ],
    region: "Southern Red Sea, between Yemen and the Horn of Africa",
    kind: "strait",
    description:
      "Bab al-Mandab is the southern gate of the Red Sea, between Yemen and Djibouti and Eritrea, with Perim Island in the strait. Ships that use the Suez Canal pass through it. The long alternative is the Cape of Good Hope.",
    whyItMatters:
      "EIA’s table shows oil through the strait falling from 9.3 million barrels a day in 2023 to 4.2 million in the first half of 2025, after many ships left the Red Sea in 2024. UNCTAD still treats it as a large share of seaborne containers and cars. Volume and control of the shoreline are different questions: a lower oil figure does not mean the passage is quiet.",
    shares: [
      {
        id: "oil",
        value: "4.2 million b/d",
        label: "Oil and petroleum liquids",
        asOf: "First half of 2025",
        note: "EIA’s chokepoint table: 9.3 million b/d in 2023, 4.1 in 2024, and 4.2 in the first half of 2025. An earlier EIA note, using data through August 2024, described a drop from 8.7 million b/d in 2023 to about 4.0.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
      {
        id: "trade",
        value: "8.7% of seaborne trade",
        label: "All seaborne trade by volume",
        asOf: "2023",
        note: "UNCTAD’s 2024 review. The same table lists about 20% of seaborne cars and 20% of seaborne containers, 15% of oil products, and 13% of crude oil. Those are 2023 shares, before the fuller 2024 diversion.",
        sourceName: "UNCTAD, Review of Maritime Transport 2024",
        sourceUrl: UNCTAD_RMT.url,
      },
    ],
    sources: [EIA_CHOKEPOINTS, EIA_RED_SEA, UNCTAD_RMT],
  },
  {
    id: "suez",
    name: "Suez Canal",
    shortName: "Suez",
    aliases: ["suez", "suez canal"],
    keywords: ["suez canal", "suez"],
    region: "Egypt, between the Mediterranean and the Red Sea",
    kind: "canal",
    description:
      "The Suez Canal is an Egyptian sea-level canal. The Suez Canal Authority operates it and publishes transit notices. The SUMED pipeline can move some oil between the Red Sea and the Mediterranean when the canal is constrained. Ships reaching Suez from the south still pass Bab al-Mandab.",
    whyItMatters:
      "UNCTAD describes the canal as about a tenth of world maritime trade by volume and about a fifth of container trade. EIA’s oil series for the canal plus SUMED fell by almost half between 2023 and the first half of 2025, in line with Red Sea diversions. A canal can be open while the approach to it is not.",
    shares: [
      {
        id: "oil",
        value: "4.9 million b/d",
        label: "Oil via the canal and SUMED",
        asOf: "First half of 2025",
        note: "EIA’s chokepoint table, row “Suez Canal and SUMED Pipeline”: 8.8 million b/d in 2023, 4.8 in 2024, and 4.9 in the first half of 2025.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
      {
        id: "containers",
        value: "About 22% of container trade",
        label: "Containerized trade",
        asOf: "2023, published 2024",
        note: "UNCTAD’s Review of Maritime Transport 2024 says about 10% of world maritime trade by volume and 22% of world container trade. A chokepoint table in the same review puts containers at 20% of global seaborne container volume. The figures are close; both are from that review. Actual 2024 transits were lower during Red Sea diversions.",
        sourceName: "UNCTAD, Review of Maritime Transport 2024",
        sourceUrl: UNCTAD_RMT.url,
      },
    ],
    sources: [
      EIA_CHOKEPOINTS,
      UNCTAD_RMT,
      {
        title: "Suez Canal Authority news",
        url: "https://www.suezcanal.gov.eg/English/MediaCenter/News/pages/default.aspx",
        publisher: "Suez Canal Authority",
      },
    ],
  },
  {
    id: "panama",
    name: "Panama Canal",
    shortName: "Panama",
    aliases: ["panama", "panama canal"],
    keywords: ["panama canal"],
    region: "Panama, between the Atlantic and the Pacific",
    kind: "canal",
    description:
      "The Panama Canal crosses the Isthmus of Panama. The Panama Canal Authority sets daily transit slots and draft limits. Those limits have been tightened in drought years. The canal matters more for containers, cars, grain, and some gas than it does for Middle East crude.",
    whyItMatters:
      "UNCTAD’s published shares for the canal do not all use the same base, so this page shows the range instead of picking one number. In 2023 and 2024 the authority cut daily transits because of low water. A slot limit is not the same thing as a closure, and this snapshot does not assume that those limits are still in force.",
    shares: [
      {
        id: "oil",
        value: "2.3 million b/d",
        label: "Oil and petroleum liquids",
        asOf: "First half of 2025, fiscal-year basis",
        note: "EIA’s chokepoint table. EIA notes that Panama Canal volumes are reported by fiscal year, October to September. The same table shows 2.2 million b/d in 2023 and 2.0 in 2024.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
      {
        id: "trade",
        value: "About 2–5% of trade",
        label: "Share of world trade",
        asOf: "2023, published 2024",
        note: "UNCTAD’s Review of Maritime Transport 2024 says about 3% of global maritime trade volume, and one table in it says 2.16%. A February 2024 UNCTAD brief says the canal accounts for almost 5% of global trade. The measures differ; both documents are linked. The brief also says container ships dominate canal traffic.",
        sourceName: "UNCTAD, Review of Maritime Transport 2024",
        sourceUrl: UNCTAD_RMT.url,
      },
    ],
    sources: [
      EIA_CHOKEPOINTS,
      UNCTAD_RMT,
      UNCTAD_BRIEF,
      {
        title: "Panama Canal Authority",
        url: "https://pancanal.com/en/",
        publisher: "Panama Canal Authority",
      },
    ],
  },
  {
    id: "malacca",
    name: "Strait of Malacca",
    shortName: "Malacca",
    aliases: ["malacca", "strait of malacca", "malacca strait"],
    keywords: ["strait of malacca", "straits of malacca", "malacca strait", "malacca"],
    region: "Between the Malay Peninsula and Sumatra",
    kind: "strait",
    description:
      "The Strait of Malacca is the shortest sea route between the Indian Ocean and the South China Sea. In EIA’s table it is the largest oil-transit chokepoint. The Sunda Strait and the Lombok Strait are longer alternatives, as is a route around the Indonesian archipelago.",
    whyItMatters:
      "Most Middle East oil bound for East Asia passes here, along with a large share of other seaborne trade. Theft and armed robbery are a separate, long-running problem recorded by the IMB Piracy Reporting Centre. This project does not map those incidents, and it does not treat them as a closure of the strait.",
    shares: [
      {
        id: "oil",
        value: "23.2 million b/d",
        label: "Oil and petroleum liquids",
        asOf: "First half of 2025",
        note: "EIA’s chokepoint table, the largest oil volume in that table. EIA describes it as about 29% of maritime oil flows. The same table shows 24.0 million b/d in 2023 and 22.5 in 2024. EIA says crude is a bit over 70% of the oil flow in a typical year.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
      {
        id: "trade",
        value: "23.7% of seaborne trade",
        label: "All seaborne trade by volume",
        asOf: "2023",
        note: "UNCTAD’s Review of Maritime Transport 2024. The same table lists 45% of seaborne crude oil, 42% of propane, 26% of cars, and 23% of dry bulk. Those are shares of each commodity, not shares of traffic inside the strait.",
        sourceName: "UNCTAD, Review of Maritime Transport 2024",
        sourceUrl: UNCTAD_RMT.url,
      },
    ],
    sources: [
      EIA_CHOKEPOINTS,
      UNCTAD_RMT,
      {
        title: "IMB Piracy Reporting Centre",
        url: "https://icc-ccs.org/imb-piracy-reporting-centre-2/",
        publisher: "ICC Commercial Crime Services",
      },
    ],
  },
  {
    id: "turkish",
    name: "Turkish Straits",
    shortName: "Turkish Straits",
    aliases: ["turkish straits", "bosphorus", "bosporus", "dardanelles", "turkish"],
    keywords: ["turkish straits", "bosphorus", "bosporus", "dardanelles"],
    region: "Türkiye, between the Black Sea and the Mediterranean",
    kind: "strait",
    description:
      "The Turkish Straits are the Bosporus and the Dardanelles. They connect the Black Sea with the Mediterranean. Commercial passage sits under the 1936 Montreux Convention. Traffic is sometimes paused for weather, visibility, or an accident.",
    whyItMatters:
      "The straits are the sea exit for Black Sea and some Caspian oil, products, and grain. EIA’s oil figure is smaller than Hormuz or Malacca and still large enough to matter to regional supply. A weather pause is not the same thing as a political closure. This project does not track warship movements.",
    shares: [
      {
        id: "oil",
        value: "3.7 million b/d",
        label: "Oil and petroleum liquids",
        asOf: "First half of 2025",
        note: "EIA’s chokepoint table, row “Turkish Straits (Dardanelles)”: 3.5 million b/d in 2023, 3.6 in 2024, and 3.7 in the first half of 2025. EIA’s table does not publish a separate container share for these straits.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
    ],
    sources: [EIA_CHOKEPOINTS],
  },
  {
    id: "cape",
    name: "Cape of Good Hope",
    shortName: "Cape route",
    aliases: ["cape", "cape of good hope", "good hope", "cape route"],
    keywords: ["cape of good hope", "cape route", "around the cape"],
    region: "Open water off southern Africa",
    kind: "route",
    description:
      "The Cape of Good Hope is not a canal and not a narrow strait. It is the open route around southern Africa. Ships use it when the Suez Canal or Bab al-Mandab is unattractive. The extra distance depends on the ports and the speed. It is commonly described as several thousand nautical miles and more than a week. It is not a substitute for the Strait of Hormuz.",
    whyItMatters:
      "When Red Sea volumes fell in 2024, oil volumes around the Cape rose. UNCTAD has described that rerouting as adding distance, time, fuel, and vessel demand, including a higher demand for container ships while the diversion lasted. The Cape can be busy and still be open.",
    shares: [
      {
        id: "oil",
        value: "9.1 million b/d",
        label: "Oil and petroleum liquids",
        asOf: "First half of 2025",
        note: "EIA’s chokepoint table: 6.2 million b/d in 2023, 9.3 in 2024, and 9.1 in the first half of 2025. The 2023 figure is about 8% of that year’s maritime oil trade, close to UNCTAD’s separate 8% share of seaborne-traded oil for 2023.",
        sourceName: "EIA, World Oil Transit Chokepoints",
        sourceUrl: EIA_CHOKEPOINTS.url,
      },
      {
        id: "system",
        value: "Longer route, not a gate",
        label: "Effect of diverting from Suez",
        asOf: "June 2024 comparison, UNCTAD",
        note: "UNCTAD’s 2024 review says rerouting away from the Red Sea and Suez raised global vessel demand by about 3% and container-ship demand by about 12% in a June 2024 comparison with a no-diversion case. That is a system effect, not a permanent share of world containers assigned to the Cape.",
        sourceName: "UNCTAD, Review of Maritime Transport 2024",
        sourceUrl: UNCTAD_RMT.url,
      },
    ],
    sources: [EIA_CHOKEPOINTS, EIA_RED_SEA, UNCTAD_RMT],
  },
];

export function passageById(id: string): Passage | undefined {
  return passages.find((passage) => passage.id === id);
}
