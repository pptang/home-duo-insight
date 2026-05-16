/**
 * Shared display formatters for comparison/property data.
 *
 * Extracted from Feed.tsx so the Feed and Dashboard pages stay byte-for-byte
 * consistent instead of each keeping their own copy.
 */

/** Format a yen price into a compact Japanese string, e.g. "¥8,500万". */
export const formatPrice = (price: number | null): string => {
  if (price === null) return "—";
  if (price >= 100000000) return `¥${(price / 100000000).toFixed(2)}億`;
  if (price >= 10000) return `¥${(price / 10000).toFixed(0)}万`;
  return `¥${price.toLocaleString()}`;
};

/** Relative date string from an ISO timestamp, e.g. "本日" / "3日前" / "2ヶ月前". */
export const dateAgo = (iso: string): string => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "本日";
  if (days < 30) return `${days}日前`;
  return `${Math.floor(days / 30)}ヶ月前`;
};
