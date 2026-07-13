import type { ComponentType } from "react";
import { FukuokaOsakaKeyVisual } from "@/components/guides/FukuokaOsakaKeyVisual";
import { MinatoChuoKeyVisual } from "@/components/guides/MinatoChuoKeyVisual";

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
  /**
   * Optional zh-TW card copy, for guides (like minato-vs-chuo) that have a
   * full Traditional Chinese article version. Guides without this fall back
   * to the English fields above for zh-TW visitors too (e.g. fukuoka-vs-osaka,
   * which — like the rest of "expert-facing" content — is en/ja only for now).
   */
  zh?: { title: string; excerpt: string; category: string; date: string };
  /** Plain raster cover image. Ignored when coverComponent is set. */
  coverImage?: string;
  /**
   * Vector cover graphic, for guides (like a city-vs-city comparison) whose
   * cover is a composed illustration rather than a single photo/icon — a raw
   * image cropped with object-cover would crop out one side of the graphic.
   */
  coverComponent?: ComponentType<{ className?: string }>;
}

export const GUIDES: readonly GuideEntry[] = [
  {
    slug: "fukuoka-vs-osaka",
    title: "Fukuoka vs Osaka: Where is the next move not yet priced in?",
    excerpt:
      "Most investors compare +58% vs +32% and call it done. That's the wrong question. For anyone entering in 2026, what matters is which market still has a catalyst the price hasn't caught up with.",
    category: "Investment Analysis",
    date: "July 2026",
    coverComponent: FukuokaOsakaKeyVisual,
  },
  {
    slug: "minato-vs-chuo",
    title: "港区 vs 中央区: Same city, two completely different lives",
    excerpt:
      "Both wards draw the same HK and TW buyers. The numbers are closer than you'd expect. What's not close at all is the daily experience of actually living there.",
    category: "Investment Analysis",
    date: "July 2026",
    zh: {
      title: "港區 vs 中央區：同一座城市，兩種完全不同的生活",
      excerpt:
        "兩個行政區吸引的是同一群買家——來自香港與台灣、認真考慮東京市場的現金買家。房價差距比你想像中小，真正天差地遠的，是住在那裡的日常生活。",
      category: "投資分析",
      date: "2026年7月",
    },
    coverComponent: MinatoChuoKeyVisual,
  },
];

export function getGuideBySlug(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
