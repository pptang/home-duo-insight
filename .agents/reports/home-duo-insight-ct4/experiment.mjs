#!/usr/bin/env node
// home-duo-insight-ct4 experiment: does Firecrawl `onlyMainContent: true`
// surface enough SUUMO listing images for extractImageUrls()?
//
// Usage:
//   FIRECRAWL_URL=... FIRECRAWL_API_KEY=... node experiment.mjs
//
// For each SUUMO URL, calls POST {FIRECRAWL_URL}/v1/scrape twice
// (onlyMainContent false / true), runs the REAL extractImageUrls() ported
// verbatim from supabase/functions/parse-properties/index.ts, and writes
// raw HTML + a measurements JSON into ./raw/.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, "raw");
mkdirSync(RAW_DIR, { recursive: true });

const FIRECRAWL_URL = process.env.FIRECRAWL_URL || "https://api.firecrawl.dev";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
if (!FIRECRAWL_API_KEY) {
  console.error("FIRECRAWL_API_KEY not set");
  process.exit(1);
}

const URLS = [
  "https://suumo.jp/ms/chuko/tokyo/sc_chuo/nc_20807881/",
  "https://suumo.jp/ms/chuko/tokyo/sc_chuo/nc_20838470/",
  "https://suumo.jp/ms/chuko/tokyo/sc_chuo/nc_20817821/",
];

// ===========================================================================
// extractImageUrls() — ported VERBATIM from
// supabase/functions/parse-properties/index.ts (lines 187-317).
// Only change: console.log calls removed for clean output.
// ===========================================================================
function extractImageUrls(html) {
  const images = [];
  try {
    const imgPatterns = [
      /<img[^>]+src=['"']([^'"]+)['"']/gi,
      /<img[^>]+data-src=['"']([^'"]+)['"']/gi,
      /background-image:\s*url\(['"']?([^'"()]+)['"']?\)/gi,
      /data-[^=]*image[^=]*=['"']([^'"]+)['"']/gi,
      /\[!\[[^\]]*\]\(([^)]+)\)/gi,
      /(?:gazo|shashin|bukken)[^=]*=['"']([^'"]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^'"]*)?)['"']/gi,
      /(https?:\/\/img01\.suumo\.com[^'")\s]*\.(?:jpg|jpeg|png|webp|gif)(?:\?[^'")\s]*)?)/gi,
      /(https?:\/\/[^'")\s]*front\/gazo\/bukken\/[^'")\s]*\.(?:jpg|jpeg|png|webp|gif)(?:\?[^'")\s]*)?)/gi,
      /(https?:\/\/www\.athome\.co\.jp\/image_files\/path\/[A-Za-z0-9+/=_-]+(?:\?[^'")\s]*)?)/gi,
      /["'](https?:\/\/www\.athome\.co\.jp\/image_files\/path\/[A-Za-z0-9+/=_-]+[^"']*)['"]/gi,
    ];

    for (const pattern of imgPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let url = match[1] || match[0];
        if (!url) continue;
        url = url.trim();
        url = url
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"');
        if (url.includes("%2F")) {
          url = decodeURIComponent(url);
        }
        if (url.startsWith("//")) {
          url = "https:" + url;
        } else if (url.startsWith("/")) {
          if (url.includes("gazo") || url.includes("bukken")) {
            url = "https://img01.suumo.com" + url;
          } else if (url.includes("image_files")) {
            url = "https://www.athome.co.jp" + url;
          } else {
            continue;
          }
        } else if (!url.startsWith("http")) {
          if (url.includes("img01.suumo.com")) {
            url = "https://" + url;
          } else if (url.includes("athome.co.jp")) {
            url = "https://" + url;
          }
        }

        const hasImageExtension = url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i);
        const isAthomeImage =
          url.includes("athome.co.jp/image_files/path/") &&
          url.match(/\/path\/[A-Za-z0-9+/=_-]{10,}/);
        const isSuumoImage =
          url.includes("suumo.com") && url.match(/\.(jpg|jpeg|png|webp|gif)/i);

        if (hasImageExtension || isAthomeImage || isSuumoImage) {
          const isPlaceholder =
            url.includes("/no_image") ||
            url.includes("no-image") ||
            url.includes("placeholder");
          const isStaticAsset =
            url.includes("/static_app_contents/") ||
            url.includes("/assets/common/") ||
            url.includes("/assets/pc/");
          const isMapImage =
            url.includes("maps.gstatic.com") ||
            url.includes("maps.google.com") ||
            url.includes("mapfiles");
          const isTransparent =
            url.includes("transparent.png") || url.includes("pixel.gif");

          if (
            !isPlaceholder &&
            !isStaticAsset &&
            !isMapImage &&
            !isTransparent &&
            !url.match(/(icon|logo|btn|nav|menu|header|footer|ui|thumb|spacer|loading)/i)
          ) {
            let priority = 0;
            if (isAthomeImage) {
              priority += 90;
              if (url.includes("width=") && url.includes("height=")) priority += 20;
            }
            if (url.match(/_000[1-5]\.jpg|_00[0-5][0-9]\.jpg/i)) priority += 100;
            if (url.match(/(gazo|bukken|madori|heimen)/i)) priority += 80;
            if (url.match(/(リビング|キッチン|浴室|寝室|玄関|外観|内観|間取)/i))
              priority += 70;
            if (url.match(/(main|primary|hero|large|big)/i)) priority += 60;
            if (url.match(/(_001|_01|_1\.)/i)) priority += 50;
            images.push({ url, priority });
          }
        }
      }
    }

    const sortedImages = images
      .sort((a, b) => b.priority - a.priority)
      .map((img) => img.url);
    const uniqueImages = [...new Set(sortedImages)];
    return uniqueImages.slice(0, 20);
  } catch (error) {
    console.error("Error extracting images:", error);
    return [];
  }
}
// ===========================================================================

async function scrape(url, onlyMainContent) {
  const startTime = Date.now();
  const res = await fetch(`${FIRECRAWL_URL}/v1/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["html"],
      onlyMainContent,
    }),
  });
  const ms = Date.now() - startTime;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `HTTP ${res.status} ${res.statusText}: ${body.slice(0, 300)}`, ms };
  }
  const data = await res.json();
  if (!data.success) {
    return { error: `Firecrawl failure: ${JSON.stringify(data).slice(0, 300)}`, ms };
  }
  const html = data.data?.html;
  if (!html) {
    return { error: "No HTML returned", ms };
  }
  return { html, ms };
}

const results = [];
for (const url of URLS) {
  const slug = url.match(/nc_(\d+)/)[1];
  for (const onlyMainContent of [false, true]) {
    const mode = onlyMainContent ? "true" : "false";
    process.stderr.write(`scraping ${slug} onlyMainContent=${mode} ... `);
    const r = await scrape(url, onlyMainContent);
    if (r.error) {
      process.stderr.write(`ERROR: ${r.error}\n`);
      results.push({ url, slug, onlyMainContent, error: r.error, ms: r.ms });
      continue;
    }
    const file = join(RAW_DIR, `${slug}-onlyMainContent-${mode}.html`);
    writeFileSync(file, r.html);
    const images = extractImageUrls(r.html);
    const withResizeParams = images.filter((u) => /[?&]w=\d+/.test(u) && /[?&]h=\d+/.test(u)).length;
    process.stderr.write(`html=${r.html.length}B images=${images.length}\n`);
    results.push({
      url,
      slug,
      onlyMainContent,
      htmlBytes: r.html.length,
      imageCount: images.length,
      withResizeParams,
      sample: images.slice(0, 3),
      ms: r.ms,
    });
  }
}

writeFileSync(
  join(__dirname, "measurements.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), firecrawlUrl: FIRECRAWL_URL, results }, null, 2),
);

// Print comparison table
console.log("\n=== RESULTS ===");
for (const url of URLS) {
  const slug = url.match(/nc_(\d+)/)[1];
  const f = results.find((r) => r.slug === slug && r.onlyMainContent === false);
  const t = results.find((r) => r.slug === slug && r.onlyMainContent === true);
  console.log(`\nURL: ${url}`);
  for (const [label, r] of [["onlyMainContent=false", f], ["onlyMainContent=true ", t]]) {
    if (r.error) {
      console.log(`  ${label}: ERROR ${r.error}`);
    } else {
      console.log(
        `  ${label}: html=${r.htmlBytes}B  images=${r.imageCount}  resizeParams=${r.withResizeParams}  ${r.ms}ms`,
      );
      r.sample.forEach((s, i) => console.log(`      [${i}] ${s}`));
    }
  }
}
console.log("\nmeasurements.json + raw/ written to", __dirname);
