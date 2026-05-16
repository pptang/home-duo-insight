#!/usr/bin/env node
// Diffs the full extractImageUrls() output of the false vs true raw HTML
// captured by experiment.mjs. Re-uses the same ported extractImageUrls().
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractImageUrls(html) {
  const images = [];
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
      url = url.trim()
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      if (url.includes("%2F")) url = decodeURIComponent(url);
      if (url.startsWith("//")) url = "https:" + url;
      else if (url.startsWith("/")) {
        if (url.includes("gazo") || url.includes("bukken")) url = "https://img01.suumo.com" + url;
        else if (url.includes("image_files")) url = "https://www.athome.co.jp" + url;
        else continue;
      } else if (!url.startsWith("http")) {
        if (url.includes("img01.suumo.com")) url = "https://" + url;
        else if (url.includes("athome.co.jp")) url = "https://" + url;
      }
      const hasImageExtension = url.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i);
      const isAthomeImage = url.includes("athome.co.jp/image_files/path/") && url.match(/\/path\/[A-Za-z0-9+/=_-]{10,}/);
      const isSuumoImage = url.includes("suumo.com") && url.match(/\.(jpg|jpeg|png|webp|gif)/i);
      if (hasImageExtension || isAthomeImage || isSuumoImage) {
        const isPlaceholder = url.includes("/no_image") || url.includes("no-image") || url.includes("placeholder");
        const isStaticAsset = url.includes("/static_app_contents/") || url.includes("/assets/common/") || url.includes("/assets/pc/");
        const isMapImage = url.includes("maps.gstatic.com") || url.includes("maps.google.com") || url.includes("mapfiles");
        const isTransparent = url.includes("transparent.png") || url.includes("pixel.gif");
        if (!isPlaceholder && !isStaticAsset && !isMapImage && !isTransparent &&
            !url.match(/(icon|logo|btn|nav|menu|header|footer|ui|thumb|spacer|loading)/i)) {
          let priority = 0;
          if (isAthomeImage) { priority += 90; if (url.includes("width=") && url.includes("height=")) priority += 20; }
          if (url.match(/_000[1-5]\.jpg|_00[0-5][0-9]\.jpg/i)) priority += 100;
          if (url.match(/(gazo|bukken|madori|heimen)/i)) priority += 80;
          if (url.match(/(リビング|キッチン|浴室|寝室|玄関|外観|内観|間取)/i)) priority += 70;
          if (url.match(/(main|primary|hero|large|big)/i)) priority += 60;
          if (url.match(/(_001|_01|_1\.)/i)) priority += 50;
          images.push({ url, priority });
        }
      }
    }
  }
  return [...new Set(images.sort((a, b) => b.priority - a.priority).map((i) => i.url))].slice(0, 20);
}

const slugs = ["20807881", "20838470", "20817821"];
for (const s of slugs) {
  const f = extractImageUrls(readFileSync(join(__dirname, "raw", `${s}-onlyMainContent-false.html`), "utf8"));
  const t = extractImageUrls(readFileSync(join(__dirname, "raw", `${s}-onlyMainContent-true.html`), "utf8"));
  const setF = new Set(f), setT = new Set(t);
  const onlyF = f.filter((u) => !setT.has(u));
  const onlyT = t.filter((u) => !setF.has(u));
  const identical = JSON.stringify(f) === JSON.stringify(t);
  console.log(`${s}: false=${f.length} true=${t.length} identicalOrdered=${identical} onlyInFalse=${onlyF.length} onlyInTrue=${onlyT.length}`);
  if (onlyF.length) console.log("   only in false:", onlyF);
  if (onlyT.length) console.log("   only in true :", onlyT);
}
