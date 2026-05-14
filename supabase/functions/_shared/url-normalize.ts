// URL normalization for comparison deduplication.
//
// IMPORTANT: This is a vendored copy of `src/lib/url-normalize.ts`. Edge
// functions run on Deno and cannot import from the Vite `src/` tree, so the
// helper is duplicated here. Keep both files in sync — if you change the
// normalization rules, update BOTH files.

const TRACKING_PARAM_PATTERNS: ReadonlyArray<string> = [
  "utm_*",
  "gclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "yclid",
  "_ga",
  "_gl",
  "ref",
  "ref_src",
  "referrer",
  "trflg",
  "trk",
];

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  for (const pat of TRACKING_PARAM_PATTERNS) {
    if (pat.endsWith("*")) {
      if (lower.startsWith(pat.slice(0, -1))) return true;
    } else if (lower === pat) {
      return true;
    }
  }
  return false;
}

export function normalizeListingUrl(input: string): string {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "";

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed.toLowerCase();
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return trimmed.toLowerCase();
  }

  let host = url.hostname.toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);

  let port = url.port;
  if (
    (url.protocol === "http:" && port === "80") ||
    (url.protocol === "https:" && port === "443")
  ) {
    port = "";
  }

  let pathname = url.pathname || "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  const keptParams: Array<[string, string]> = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (isTrackingParam(key)) continue;
    keptParams.push([key, value]);
  }
  keptParams.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] < b[0] ? -1 : 1;
    return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
  });
  const search = keptParams.length
    ? "?" +
      keptParams
        .map(
          ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
        )
        .join("&")
    : "";

  const authority = port ? `${host}:${port}` : host;
  return `${url.protocol}//${authority}${pathname}${search}`;
}

export function buildPairKey(urlA: string, urlB: string): string | null {
  const a = normalizeListingUrl(urlA);
  const b = normalizeListingUrl(urlB);
  if (!a || !b) return null;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function todayDateBucket(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
