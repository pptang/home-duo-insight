/**
 * URL normalization for comparison deduplication.
 *
 * Goal: collapse "the same listing" reached through different URLs into a
 * stable canonical form so we can detect when two property URLs (in any
 * order) refer to a comparison we've already created in the last 24 hours.
 *
 * Normalization rules (in order):
 *   1. Parse as URL; reject if not http/https → return original trimmed string
 *      (the supported-site whitelist already rejects junk before this point;
 *      this is just defense in depth so we never throw).
 *   2. Lowercase the hostname, strip a single trailing dot.
 *   3. Drop default ports (:80 / :443).
 *   4. Strip the fragment (`#...`) — never meaningful for listing identity.
 *   5. Remove tracking query params (utm_*, gclid, fbclid, msclkid, ref, …).
 *      Listing-identity params are preserved (e.g. `bukken=`, `pid=`, …).
 *   6. Sort remaining query params alphabetically so `?a=1&b=2` and
 *      `?b=2&a=1` collapse to the same string.
 *   7. Strip a trailing slash from the pathname when it isn't the root
 *      (`/foo/` → `/foo`, but `/` stays `/`).
 *
 * The output is a deterministic string that can be hashed/concatenated to
 * form a comparison `pair_key` (see {@link buildPairKey}).
 *
 * NOTE: A vendored copy of this module lives at
 * `supabase/functions/_shared/url-normalize.ts` for the Deno edge runtime.
 * Keep both files in sync.
 */

// Param names (or prefixes) that never change which listing the URL points to
// and should be stripped before canonicalization. Lowercase; prefix entries
// end with `*`.
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

  // Hostname: lowercase, drop trailing dot.
  let host = url.hostname.toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);

  // Drop default ports.
  let port = url.port;
  if (
    (url.protocol === "http:" && port === "80") ||
    (url.protocol === "https:" && port === "443")
  ) {
    port = "";
  }

  // Pathname: strip a trailing slash unless it's the root.
  let pathname = url.pathname || "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  // Query: drop tracking params, sort the rest.
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

/**
 * Build a deterministic key for a comparison pair. The two URLs are
 * normalized then sorted, so `(A, B)` and `(B, A)` produce the same key.
 *
 * The returned string is intended to be stored in
 * `comparisons.pair_key` and combined with a `date_bucket` (UTC date of
 * creation) to enforce "no duplicate of the same pair on the same day".
 *
 * Returns `null` if either input fails to produce a non-empty normalized
 * URL — callers should fall back to inserting without a pair_key in that
 * case (it just means we won't dedupe this row).
 */
export function buildPairKey(urlA: string, urlB: string): string | null {
  const a = normalizeListingUrl(urlA);
  const b = normalizeListingUrl(urlB);
  if (!a || !b) return null;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * UTC date bucket for an arbitrary timestamp (defaults to now). Returns a
 * `YYYY-MM-DD` string so it can be cast to Postgres `date` directly.
 *
 * UTC is intentional: the dedupe window is "the same listing pair submitted
 * within ~24 hours", and using UTC avoids a discontinuity at JST midnight
 * that could let a duplicate slip through across a timezone boundary.
 */
export function todayDateBucket(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
