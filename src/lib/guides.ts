// Registry of static editorial "Guides" articles (city comparisons, renting
// tips, neighborhood explainers, etc.). Each entry is metadata for the
// /guides index listing; the article body lives in its own page component
// registered separately in routes.ts (bespoke long-form content isn't
// data-driven, so there's no generic slug -> component lookup here).

export interface GuideEntry {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  coverImage: string;
}

export const GUIDES: readonly GuideEntry[] = [
  {
    slug: "fukuoka-vs-osaka",
    title: "Fukuoka vs Osaka: Where is the next move not yet priced in?",
    excerpt:
      "Most investors compare +58% vs +32% and call it done. That's the wrong question. For anyone entering in 2026, what matters is which market still has a catalyst the price hasn't caught up with.",
    category: "Investment Analysis",
    date: "July 2026",
    coverImage: "/images/compare/fukuoka-vs-osaka/img-osaka-tsutenkaku.png",
  },
];

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
