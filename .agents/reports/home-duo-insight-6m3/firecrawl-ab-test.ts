// A/B test harness for home-duo-insight-6m3
// Re-evaluates the hardcoded Firecrawl `wait 3000ms + scroll` actions in
// parse-properties/index.ts:350-353.
//
// extractImageUrls() is copied verbatim from parse-properties/index.ts
// (it is not exported there). See _extract.ts.frag — generated via:
//   sed -n '187,317p' supabase/functions/parse-properties/index.ts
//
// Run: deno run --allow-net firecrawl-ab-test.ts
// __EXTRACT_FN_PLACEHOLDER__

const FIRECRAWL_URL = Deno.env.get("FIRECRAWL_URL") || "http://localhost:3002";

// Live listing URLs verified 2026-05-16 (statusCode 200). The URLs in the
// repo's test scripts (nc_73125861 etc.) are expired -> SUUMO/athome 404.
const TEST_URLS: Record<string, string> = {
  "suumo-A": "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20364769/",
  "suumo-B": "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20477241/",
  "athome-A": "https://www.athome.co.jp/mansion/1003171587/",
  "athome-B": "https://www.athome.co.jp/mansion/1015546187/",
};

type Variant = { name: string; actions: unknown[] | undefined };
const VARIANTS: Variant[] = [
  { name: "current (wait 3000 + scroll)", actions: [
    { type: "wait", milliseconds: 3000 },
    { type: "scroll", direction: "down" },
  ] },
  { name: "no actions", actions: undefined },
  { name: "scroll only", actions: [{ type: "scroll", direction: "down" }] },
  { name: "wait 800 + scroll", actions: [
    { type: "wait", milliseconds: 800 },
    { type: "scroll", direction: "down" },
  ] },
];

async function scrapeOnce(url: string, actions: unknown[] | undefined) {
  const body: Record<string, unknown> = {
    url,
    formats: ["html"],
    onlyMainContent: false,
  };
  if (actions) body.actions = actions;
  const t0 = Date.now();
  const res = await fetch(`${FIRECRAWL_URL}/v1/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - t0;
  if (!res.ok) {
    return { ms, ok: false, images: [] as string[], err: `HTTP ${res.status}` };
  }
  const data = await res.json();
  if (!data.success) {
    return { ms, ok: false, images: [] as string[], err: data.error || "no success" };
  }
  const html: string = data.data?.html || "";
  return { ms, ok: true, images: extractImageUrls(html), htmlLen: html.length, err: "" };
}

// Retry up to 3x to absorb transient self-hosted-Firecrawl 500s.
async function scrape(url: string, actions: unknown[] | undefined) {
  let last = await scrapeOnce(url, actions);
  for (let i = 0; i < 2 && !last.ok; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    last = await scrapeOnce(url, actions);
  }
  return last;
}

type VRes = { ms: number; count: number; ok: boolean; err: string; images: string[] };
const results: Record<string, Record<string, VRes>> = {};

for (const [label, url] of Object.entries(TEST_URLS)) {
  results[label] = {};
  console.log(`\n=== ${label} : ${url} ===`);
  for (const v of VARIANTS) {
    try {
      const r = await scrape(url, v.actions);
      results[label][v.name] = { ms: r.ms, count: r.images.length, ok: r.ok, err: r.err, images: r.images };
      console.log(
        `  ${v.name.padEnd(28)} ms=${String(r.ms).padStart(6)}  images=${String(r.images.length).padStart(3)}  ${r.ok ? "" : "ERR:" + r.err}`,
      );
    } catch (e) {
      results[label][v.name] = { ms: -1, count: -1, ok: false, err: String(e), images: [] };
      console.log(`  ${v.name.padEnd(28)} EXCEPTION ${e}`);
    }
  }
  // Diff: which images does the current config capture that "no actions" misses?
  const cur = results[label]["current (wait 3000 + scroll)"];
  const noa = results[label]["no actions"];
  if (cur?.ok && noa?.ok) {
    const noaSet = new Set(noa.images);
    const onlyInCurrent = cur.images.filter((u) => !noaSet.has(u));
    console.log(`  -> images ONLY in current (lost if actions removed): ${onlyInCurrent.length}`);
    onlyInCurrent.slice(0, 5).forEach((u) => console.log(`       ${u}`));
  }
}

console.log("\n\n===== SUMMARY (images captured / scrape ms) =====");
console.log("variant".padEnd(30) + Object.keys(TEST_URLS).map((k) => k.padEnd(20)).join(""));
for (const v of VARIANTS) {
  let row = v.name.padEnd(30);
  for (const label of Object.keys(TEST_URLS)) {
    const r = results[label][v.name];
    row += `${r.count}img/${r.ms}ms`.padEnd(20);
  }
  console.log(row);
}

await Deno.writeTextFile(
  ".agents/reports/home-duo-insight-6m3/ab-results.json",
  JSON.stringify(results, null, 2),
);
console.log("\nWrote ab-results.json");
