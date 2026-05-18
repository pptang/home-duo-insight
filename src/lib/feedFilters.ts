// Pure filter logic for the Feed sidebar (物件種別 + 間取り).
// No React. No side effects. All functions are deterministic.

export interface PropertyLike {
  property_type: string | null;
  floor_plan: string | null;
}

export interface ComparisonLike {
  propertyA: PropertyLike;
  propertyB: PropertyLike;
}

// ---------------------------------------------------------------------------
// 物件種別 buckets
// ---------------------------------------------------------------------------

export const PROPERTY_TYPE_BUCKETS: {
  id: string;
  label: string;
  match: (raw: string) => boolean;
}[] = [
  {
    id: "used_mansion",
    label: "中古マンション",
    match: (raw) => raw.includes("中古") && raw.includes("マンション"),
  },
  {
    id: "new_mansion",
    label: "新築マンション",
    match: (raw) => raw.includes("新築") && raw.includes("マンション"),
  },
  {
    id: "house",
    label: "一戸建て",
    match: (raw) => raw.includes("戸建"),
  },
  {
    id: "rental",
    label: "賃貸",
    match: (raw) => raw.includes("賃貸"),
  },
];

// ---------------------------------------------------------------------------
// 間取り buckets
// ---------------------------------------------------------------------------

// Convert fullwidth ASCII variants (U+FF01–FF5E) to halfwidth equivalents.
export function normalizeFloorPlan(raw: string): string {
  return raw
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0xff01 && code <= 0xff5e
        ? String.fromCharCode(code - 0xfee0)
        : ch;
    })
    .join("")
    .toUpperCase();
}

// Extract layout tokens from a normalized floor-plan string.
// The S? consumes an optional service-room S without capturing it, so
// 1SLDK -> (1, "LDK"), 1LDK -> (1, "LDK").
export function extractLayoutTokens(
  raw: string,
): { digit: number; suffix: "LDK" | "DK" | "K" }[] {
  const results: { digit: number; suffix: "LDK" | "DK" | "K" }[] = [];
  const re = /(\d+)S?(LDK|DK|K)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    results.push({
      digit: parseInt(m[1], 10),
      suffix: m[2] as "LDK" | "DK" | "K",
    });
  }
  return results;
}

export const LAYOUT_BUCKETS: {
  id: string;
  label: string;
  match: (raw: string) => boolean;
}[] = [
  {
    id: "1k",
    label: "1K",
    match: (raw) => {
      const normalized = normalizeFloorPlan(raw);
      return extractLayoutTokens(normalized).some(
        (t) => t.digit === 1 && t.suffix === "K",
      );
    },
  },
  {
    id: "1dk",
    label: "1DK",
    match: (raw) => {
      const normalized = normalizeFloorPlan(raw);
      return extractLayoutTokens(normalized).some(
        (t) => t.digit === 1 && t.suffix === "DK",
      );
    },
  },
  {
    id: "1ldk",
    label: "1LDK",
    match: (raw) => {
      const normalized = normalizeFloorPlan(raw);
      return extractLayoutTokens(normalized).some(
        (t) => t.digit === 1 && t.suffix === "LDK",
      );
    },
  },
  {
    id: "2ldk",
    label: "2LDK",
    match: (raw) => {
      const normalized = normalizeFloorPlan(raw);
      return extractLayoutTokens(normalized).some(
        (t) => t.digit === 2 && t.suffix === "LDK",
      );
    },
  },
  {
    id: "3ldk",
    label: "3LDK",
    match: (raw) => {
      const normalized = normalizeFloorPlan(raw);
      return extractLayoutTokens(normalized).some(
        (t) => t.digit === 3 && t.suffix === "LDK",
      );
    },
  },
  {
    id: "4ldk_plus",
    label: "4LDK以上",
    match: (raw) => {
      const normalized = normalizeFloorPlan(raw);
      return extractLayoutTokens(normalized).some(
        (t) => t.suffix === "LDK" && t.digit >= 4,
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Valid ID sets (used for URL parsing / validation)
// ---------------------------------------------------------------------------

export const VALID_TYPE_IDS = new Set(PROPERTY_TYPE_BUCKETS.map((b) => b.id));
export const VALID_LAYOUT_IDS = new Set(LAYOUT_BUCKETS.map((b) => b.id));

// ---------------------------------------------------------------------------
// Matchers
// ---------------------------------------------------------------------------

export function propertyMatchesTypes(
  p: PropertyLike,
  set: Set<string>,
): boolean {
  if (set.size === 0) return true;
  const raw = p.property_type?.trim() ?? "";
  if (!raw) return false;
  return PROPERTY_TYPE_BUCKETS.some((b) => set.has(b.id) && b.match(raw));
}

export function propertyMatchesLayouts(
  p: PropertyLike,
  set: Set<string>,
): boolean {
  if (set.size === 0) return true;
  const raw = p.floor_plan ?? "";
  if (!raw) return false;
  return LAYOUT_BUCKETS.some((b) => set.has(b.id) && b.match(raw));
}

export function comparisonMatchesTypes(
  c: ComparisonLike,
  set: Set<string>,
): boolean {
  return (
    set.size === 0 ||
    propertyMatchesTypes(c.propertyA, set) ||
    propertyMatchesTypes(c.propertyB, set)
  );
}

export function comparisonMatchesLayouts(
  c: ComparisonLike,
  set: Set<string>,
): boolean {
  return (
    set.size === 0 ||
    propertyMatchesLayouts(c.propertyA, set) ||
    propertyMatchesLayouts(c.propertyB, set)
  );
}
