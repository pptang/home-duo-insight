// Canonical public origin for absolute URLs (sitemap, canonical links, OG tags).
// Override per-environment with VITE_SITE_URL; defaults to the production host.
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.aisum.ai";

// Default OG image — single source of truth for root.tsx and ComparisonDetail meta().
export const OG_IMAGE_URL =
  "https://qditnqwrjioypsuxwagg.supabase.co/storage/v1/object/public/public-image/og-image.jpeg";

// Site-wide default <title> — used by the root meta() and as the comparison
// page's 404 fallback. Single source of truth so the two can't drift.
export const SITE_TITLE = "AiSumai (愛住) - Compare Homes in Japan with AI & Experts";

// Site-wide default meta description — used by the root meta() and the landing
// page (Index) meta(). Single source of truth so the two can't drift.
export const SITE_DESC =
  "AiSumai (愛住) helps renters and home buyers in Japan compare two homes side by side with AI analysis, expert insights, and community wisdom.";
