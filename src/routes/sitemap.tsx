import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  return new Date(createdAt).toISOString().slice(0, 10);
}

interface UrlEntry {
  path: string;
  lastmod: string | null;
}

export async function loader() {
  const staticEntries: UrlEntry[] = [
    { path: "/", lastmod: null },
    { path: "/feed", lastmod: null },
    { path: "/experts", lastmod: null },
    { path: "/about", lastmod: null },
    { path: "/guides", lastmod: null },
    { path: "/guides/fukuoka-vs-osaka", lastmod: null },
    { path: "/guides/minato-vs-chuo", lastmod: null },
  ];

  const comparisonEntries: UrlEntry[] = [];
  const expertEntries: UrlEntry[] = [];

  // Run both queries concurrently (DB wait sum→max). Each promise keeps its own
  // resilient fallback: a rejected/failed query leaves that segment empty and the
  // loader still returns a valid 200 urlset. `.limit(50000)` honors the sitemap
  // spec cap; the descending order means a future truncation keeps the newest rows.
  const comparisonsPromise = supabase
    .from("comparisons")
    .select("id, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50000);

  const expertsPromise = supabase
    .from("expert_profiles")
    .select("id, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50000);

  const [comparisonsResult, expertsResult] = await Promise.allSettled([
    comparisonsPromise,
    expertsPromise,
  ]);

  // Comparisons — resilient: a failure falls back to empty
  if (comparisonsResult.status === "rejected") {
    console.error("[sitemap] comparisons fetch threw:", comparisonsResult.reason);
  } else {
    const { data, error } = comparisonsResult.value;
    if (error) {
      console.error("[sitemap] comparisons query error:", error);
    } else if (data) {
      for (const row of data) {
        comparisonEntries.push({
          path: `/comparisons/${row.id}`,
          lastmod: formatLastmod(row.created_at),
        });
      }
    }
  }

  // Expert profiles — resilient: a failure falls back to empty
  if (expertsResult.status === "rejected") {
    console.error("[sitemap] expert_profiles fetch threw:", expertsResult.reason);
  } else {
    const { data, error } = expertsResult.value;
    if (error) {
      console.error("[sitemap] expert_profiles query error:", error);
    } else if (data) {
      for (const row of data) {
        expertEntries.push({
          path: `/experts/${row.id}`,
          lastmod: formatLastmod(row.created_at),
        });
      }
    }
  }

  const allEntries: UrlEntry[] = [
    ...staticEntries,
    ...comparisonEntries,
    ...expertEntries,
  ];

  const urlElements = allEntries
    .map((entry) => {
      const loc = escapeXml(`${SITE_URL}${entry.path}`);
      const lastmodTag =
        entry.lastmod != null ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlElements}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
