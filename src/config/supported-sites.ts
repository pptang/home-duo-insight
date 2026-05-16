/**
 * Whitelist of supported Japanese real estate listing sites.
 *
 * Only URLs whose hostname (case-insensitive, trailing-dot-stripped) matches
 * this set — or is a subdomain of one of the registrable suffixes — are
 * accepted by the comparison flow. This is the source of truth for the
 * frontend; the parse-properties edge function vendors its own copy because
 * Deno cannot import from `src/`.
 */

export const SUPPORTED_SITE_HOSTS: ReadonlySet<string> = new Set([
  "suumo.jp",
  "www.suumo.jp",
  "homes.co.jp",
  "www.homes.co.jp",
  "lifull.com",
  "www.lifull.com",
  "athome.co.jp",
  "www.athome.co.jp",
  "mansion-review.jp",
  "www.mansion-review.jp",
]);

/**
 * Human-readable labels for the supported sites, in display order. The frontend
 * renders this list so users can see which sites are accepted before they paste
 * a URL. Each `host` is one of the entries in `SUPPORTED_SITE_HOSTS` above —
 * keep this list in sync with the whitelist whenever a site is added/removed.
 */
export const SUPPORTED_SITES: ReadonlyArray<{ label: string; host: string }> = [
  { label: "SUUMO", host: "suumo.jp" },
  { label: "HOME'S", host: "homes.co.jp" },
  { label: "LIFULL", host: "lifull.com" },
  { label: "AtHome", host: "athome.co.jp" },
  { label: "マンションレビュー", host: "mansion-review.jp" },
];

/**
 * Registrable suffixes that any subdomain of is also accepted.
 * Used to allow e.g. `sumai.suumo.jp`, `chintai.homes.co.jp`, etc.
 */
const SUPPORTED_SITE_SUFFIXES: ReadonlyArray<string> = [
  ".suumo.jp",
  ".homes.co.jp",
  ".lifull.com",
  ".athome.co.jp",
  ".mansion-review.jp",
];

/**
 * Returns true if `value` is an http/https URL whose hostname is one of the
 * supported Japanese real estate sites (or a subdomain thereof). Returns
 * false for malformed URLs, non-http(s) protocols, or unsupported hosts.
 */
export function isSupportedRealEstateUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return false;

  if (SUPPORTED_SITE_HOSTS.has(host)) return true;

  for (const suffix of SUPPORTED_SITE_SUFFIXES) {
    if (host.endsWith(suffix)) return true;
  }

  return false;
}

/**
 * Japanese error message shown to users when an unsupported URL is entered.
 * Kept as a constant so the frontend and edge function can share the exact
 * wording.
 */
export const UNSUPPORTED_SITE_MESSAGE_JA =
  "対応している不動産サイトのURLを入力してください（SUUMO、HOMES、LIFULL、AtHome、マンションレビュー）";
