// Shared URL whitelist for Supabase Edge Functions (Deno runtime).
//
// IMPORTANT: This is a vendored copy of `src/config/supported-sites.ts`.
// Edge functions run on Deno and cannot import from the Vite `src/` tree, so
// the whitelist is duplicated here. Keep both files in sync — if you change
// the supported hosts, update BOTH `src/config/supported-sites.ts` and this
// file.

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

const SUPPORTED_SITE_SUFFIXES: ReadonlyArray<string> = [
  ".suumo.jp",
  ".homes.co.jp",
  ".lifull.com",
  ".athome.co.jp",
  ".mansion-review.jp",
];

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

export const UNSUPPORTED_SITE_MESSAGE_JA =
  "対応している不動産サイトのURLを入力してください（SUUMO、HOMES、LIFULL、AtHome、マンションレビュー）";
