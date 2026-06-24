/**
 * Responsive image helpers backed by Vercel's Image Optimization API.
 *
 * On Vercel, requests to `/_vercel/image?url=...&w=...&q=...` are transcoded to
 * AVIF/WebP (per the `images.formats` allowlist in vercel.json) and resized to
 * the requested width. We build a `srcset` of those URLs so the browser can pick
 * the smallest source that fits the layout slot — restoring the automatic
 * optimization that next/image would have provided before this app moved to
 * React Router v7.
 *
 * `/_vercel/image` only exists in the Vercel runtime. In local dev (`vite dev`)
 * and during SSR-without-Vercel it 404s, so we pass the original URL straight
 * through whenever we're not in a production build. Detection uses Vite's
 * `import.meta.env.PROD`, which is `true` only for `react-router build` output.
 */

/** Responsive widths (px) we ask Vercel to generate. Kept in sync with the
 *  `images.sizes` allowlist in vercel.json — Vercel rejects widths not listed
 *  there, so changing one means changing the other. */
export const IMAGE_WIDTHS = [256, 640, 1080, 1920] as const;

const DEFAULT_QUALITY = 75;

/** True when running in the Vercel-built bundle, where `/_vercel/image` exists. */
const canOptimize = import.meta.env.PROD;

/** Build a single optimized `/_vercel/image` URL for one width. */
function optimizedUrl(src: string, width: number, quality: number): string {
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/**
 * Build a responsive `srcset` string for `src`, e.g.
 * `"/_vercel/image?...&w=256 256w, /_vercel/image?...&w=640 640w, ..."`.
 *
 * Returns `undefined` in dev (or for empty/falsy src) so callers can omit the
 * attribute and fall back to the raw `src`.
 */
export function buildImageSrcSet(
  src: string | null | undefined,
  { widths = IMAGE_WIDTHS, quality = DEFAULT_QUALITY }: { widths?: readonly number[]; quality?: number } = {},
): string | undefined {
  if (!src || !canOptimize) return undefined;
  return [...widths]
    .sort((a, b) => a - b)
    .map((width) => `${optimizedUrl(src, width, quality)} ${width}w`)
    .join(", ");
}

/**
 * The `src` to render. In production we point it at a mid-size optimized
 * variant (used by browsers that ignore `srcset`); in dev we return the raw URL
 * unchanged so local previews still show real images.
 */
export function buildImageSrc(
  src: string | null | undefined,
  { fallbackWidth = 1080, quality = DEFAULT_QUALITY }: { fallbackWidth?: number; quality?: number } = {},
): string | undefined {
  if (!src) return undefined;
  if (!canOptimize) return src;
  return optimizedUrl(src, fallbackWidth, quality);
}
