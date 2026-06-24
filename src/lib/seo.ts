/**
 * Shared SEO meta descriptor builder for React Router v7 route-module meta().
 *
 * Returns the canonical descriptor array (title, description, canonical link,
 * og:*, twitter:*) that every public route emits. Each route's meta() becomes
 * a ~3-line call to buildMeta().
 *
 * NOTE: meta() strings MUST be static English literals — i18n pins lng="en" on
 * SSR initial render and meta() runs outside React (cannot use t()).
 */

import { OG_IMAGE_URL } from "@/lib/site";

export interface BuildMetaOptions {
  title: string;
  description: string;
  url: string;
  /** og:type value — defaults to "website" */
  ogType?: string;
}

export function buildMeta({ title, description, url, ogType = "website" }: BuildMetaOptions) {
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: ogType },
    { property: "og:image", content: OG_IMAGE_URL },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE_URL },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}
