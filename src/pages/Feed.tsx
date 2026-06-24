import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useLoaderData } from "react-router";
import type { MetaArgs, HeadersArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { SITE_URL } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
import { Plus, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, dateAgo } from "@/lib/format";
import ReportCard, { type ReportCardHighlight } from "@/components/ui/ReportCard";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import FeedFilters from "@/components/FeedFilters";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PROPERTY_TYPE_BUCKETS,
  LAYOUT_BUCKETS,
  VALID_TYPE_IDS,
  VALID_LAYOUT_IDS,
  comparisonMatchesTypes,
  comparisonMatchesLayouts,
} from "@/lib/feedFilters";

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
}

interface Property {
  id: string;
  property_name: string | null;
  price_yen: number | null;
  floor_plan: string | null;
  image_urls: string[] | null;
  property_type: string | null;
}

interface ComparisonPost {
  id: string;
  created_at: string;
  user_id: string | null;
  propertyA: Property;
  propertyB: Property;
  expertVotes?: number;
  experts?: Expert[];
}

// Reports rendered per page. Pagination is purely client-side over the
// already-fetched + filtered list — there is no /api/feed endpoint.
const PAGE_SIZE = 20;

// Parse the 1-indexed `?page=` param. Anything non-numeric or < 1 falls back
// to 1; out-of-upper-range values are kept as-is so the empty-state can show.
const parsePage = (raw: string | null): number => {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
};

// Parse a comma-separated filter param into a Set, keeping only IDs present in
// the `valid` set. Used for URL-seeded initial filter state.
const parseIdSet = (raw: string | null, valid: Set<string>): Set<string> =>
  new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => valid.has(s)),
  );

// Build the list of page tokens for the numbered control: always show first,
// last, current and its neighbours; collapse the rest into "…" gaps.
const buildPageList = (current: number, total: number): (number | "gap")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
};

// Clone `base` and apply the canonical `?page=` rule: page 1 drops the param
// entirely (clean canonical URL), any other page sets it. Single source of
// truth for both navigation (goToPage) and SEO rel=prev/next href building.
const pageParams = (base: URLSearchParams, page: number): URLSearchParams => {
  const next = new URLSearchParams(base);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  return next;
};

// Shape of a votes row joined with its expert profile — shared by the SSR
// loader and the client-side refresh effect (both transform the same query).
type VoteRow = {
  expert_user_id: string;
  expert_profiles?: { name?: string | null; profile_image_url?: string | null } | null;
};

// --- SSR loader: seed initial comparison list server-side ---

export async function loader() {
  const { data: comparisonsData, error: comparisonsError } = await supabase
    .from("comparisons")
    .select(`
      *,
      propertyA:property_a_id(id, property_name, price_yen, floor_plan, image_urls, property_type),
      propertyB:property_b_id(id, property_name, price_yen, floor_plan, image_urls, property_type)
    `)
    // Only show fully-generated reports on the public Feed.
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (comparisonsError || !comparisonsData || comparisonsData.length === 0) {
    return { comparisons: [] as ComparisonPost[] };
  }

  const transformed: ComparisonPost[] = comparisonsData
    .map((c) => {
      if (!c.propertyA || !c.propertyB || typeof c.propertyA === "string" || typeof c.propertyB === "string") {
        return null;
      }
      return {
        id: c.id,
        created_at: c.created_at,
        user_id: c.user_id,
        propertyA: c.propertyA as Property,
        propertyB: c.propertyB as Property,
        expertVotes: 0,
        experts: [] as Expert[],
      };
    })
    .filter(Boolean) as ComparisonPost[];

  await Promise.all(
    transformed.map(async (comparison) => {
      const { data: votesData } = await supabase
        .from("votes")
        .select(`id, expert_user_id, voted_for, expert_profiles!inner(id, name, profile_image_url)`)
        .eq("comparison_id", comparison.id);

      if (votesData) {
        comparison.expertVotes = votesData.length;
        const unique: Record<string, Expert> = {};
        (votesData as VoteRow[]).forEach((v) => {
          if (v.expert_profiles) {
            unique[v.expert_user_id] = {
              id: v.expert_user_id,
              name: v.expert_profiles.name || "Expert",
              profile_image_url: v.expert_profiles.profile_image_url ?? null,
            };
          }
        });
        comparison.experts = Object.values(unique);
      }
    })
  );

  return { comparisons: transformed };
}

// --- static meta for /feed (filter state not encoded in meta) ---

export function meta(_args: MetaArgs) {
  return buildMeta({
    title: "Comparison Feed — Browse AI Home Comparisons | AiSumai (愛住)",
    description:
      "Browse side-by-side AI home comparisons reviewed by real estate experts and the AiSumai community.",
    url: `${SITE_URL}/feed`,
  });
}

// --- cache headers ---

export function headers({ loaderHeaders }: HeadersArgs) {
  void loaderHeaders;
  return { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };
}

const Feed = () => {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // SSR seeds the initial list; reseed on navigation (loaderData identity changes).
  const [comparisons, setComparisons] = useState<ComparisonPost[]>(() => loaderData.comparisons);
  // SSR-seeded; start as false so the loading skeleton is skipped on initial render.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeAreas, setActiveAreas] = useState<Set<string>>(new Set());
  const [activePrices, setActivePrices] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [activePropertyTypes, setActivePropertyTypes] = useState<Set<string>>(
    () => parseIdSet(searchParams.get("propertyTypes"), VALID_TYPE_IDS),
  );
  const [activeLayouts, setActiveLayouts] = useState<Set<string>>(
    () => parseIdSet(searchParams.get("layouts"), VALID_LAYOUT_IDS),
  );

  // Current page comes straight from the URL (1-indexed).
  const currentPage = parsePage(searchParams.get("page"));

  // Single serialization of the filter/sort state. Hoisted so the ref seed and
  // the merged URL effect compare byte-identical strings — a drift between two
  // hand-written copies would silently break the change-detection guard.
  const filterSig = useMemo(
    () =>
      `${statusFilter}|${sortBy}|${[...activeAreas].sort().join(",")}|${[...activePrices].sort().join(",")}` +
      `|${[...activePropertyTypes].sort().join(",")}|${[...activeLayouts].sort().join(",")}`,
    [statusFilter, sortBy, activeAreas, activePrices, activePropertyTypes, activeLayouts],
  );

  // Track the last filter signature the merged URL effect committed. Seeded from
  // the initial signature so the first run is a no-op and an incoming `?page=`
  // deep-link survives. StrictMode-safe (a ref, not a one-shot boolean).
  const lastFilterSig = useRef(filterSig);

  // MANDATORY reseed — when React Router reuses this component instance across
  // same-route navigations, loaderData identity changes but useState lazy
  // initialisers won't re-run.
  useEffect(() => {
    setComparisons(loaderData.comparisons);
  }, [loaderData]);

  useEffect(() => {
    // SSR seeds the list on the initial render (refreshTrigger === 0); a post-
    // hydration language change (t dep) re-runs with refreshTrigger still 0 and
    // must also be skipped so SSR data is not overwritten. Only explicit retries
    // or realtime bumps set refreshTrigger > 0 and need a client fetch.
    if (refreshTrigger === 0) return;
    const fetchComparisons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: comparisonsData, error: comparisonsError } = await supabase
          .from("comparisons")
          .select(`
            *,
            propertyA:property_a_id(id, property_name, price_yen, floor_plan, image_urls, property_type),
            propertyB:property_b_id(id, property_name, price_yen, floor_plan, image_urls, property_type)
          `)
          // Only show fully-generated reports on the public Feed. Failed /
          // processing / archived rows are hidden here; they remain visible to
          // the owner on their /dashboard.
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (comparisonsError) {
          setError(t("feed.error.retry"));
          return;
        }
        if (!comparisonsData || comparisonsData.length === 0) {
          setComparisons([]);
          return;
        }

        const transformed: ComparisonPost[] = comparisonsData
          .map((c) => {
            if (!c.propertyA || !c.propertyB || typeof c.propertyA === "string" || typeof c.propertyB === "string") {
              return null;
            }
            return {
              id: c.id,
              created_at: c.created_at,
              user_id: c.user_id,
              propertyA: c.propertyA as Property,
              propertyB: c.propertyB as Property,
              expertVotes: 0,
              experts: [] as Expert[],
            };
          })
          .filter(Boolean) as ComparisonPost[];

        await Promise.all(
          transformed.map(async (comparison) => {
            const { data: votesData } = await supabase
              .from("votes")
              .select(`id, expert_user_id, voted_for, expert_profiles!inner(id, name, profile_image_url)`)
              .eq("comparison_id", comparison.id);

            if (votesData) {
              comparison.expertVotes = votesData.length;
              const unique: Record<string, Expert> = {};
              (votesData as VoteRow[]).forEach((v) => {
                if (v.expert_profiles) {
                  unique[v.expert_user_id] = {
                    id: v.expert_user_id,
                    name: v.expert_profiles.name || "Expert",
                    profile_image_url: v.expert_profiles.profile_image_url ?? null,
                  };
                }
              });
              comparison.experts = Object.values(unique);
            }
          })
        );

        setComparisons(transformed);
      } catch (err) {
        setError(t("feed.error.retry"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchComparisons();
  }, [refreshTrigger, t]);

  // Apply status filter. Extracted so the faceted count bases can reuse it
  // without duplicating the statusFilter branching logic. Memoized so it can be
  // an honest dependency of the memos below.
  const applyStatusFilter = useCallback(
    (list: ComparisonPost[]): ComparisonPost[] => {
      if (statusFilter === "expert") return list.filter((c) => (c.experts?.length ?? 0) > 0);
      if (statusFilter === "pending") return list.filter((c) => !c.experts || c.experts.length === 0);
      return list;
    },
    [statusFilter],
  );

  const filtered = useMemo(() => {
    let list = applyStatusFilter(comparisons);
    if (activePropertyTypes.size > 0)
      list = list.filter((c) => comparisonMatchesTypes(c, activePropertyTypes));
    if (activeLayouts.size > 0)
      list = list.filter((c) => comparisonMatchesLayouts(c, activeLayouts));
    if (sortBy === "popular") {
      list = [...list].sort((a, b) => (b.expertVotes ?? 0) - (a.expertVotes ?? 0));
    }
    return list;
  }, [comparisons, applyStatusFilter, sortBy, activePropertyTypes, activeLayouts]);

  // Faceted count bases: each base excludes the filter being counted so that
  // unchecked options still show how many results they would add.
  const baseForTypeCounts = useMemo(() => {
    let list = applyStatusFilter(comparisons);
    if (activeLayouts.size > 0) list = list.filter((c) => comparisonMatchesLayouts(c, activeLayouts));
    return list;
  }, [comparisons, applyStatusFilter, activeLayouts]);

  const baseForLayoutCounts = useMemo(() => {
    let list = applyStatusFilter(comparisons);
    if (activePropertyTypes.size > 0)
      list = list.filter((c) => comparisonMatchesTypes(c, activePropertyTypes));
    return list;
  }, [comparisons, applyStatusFilter, activePropertyTypes]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of PROPERTY_TYPE_BUCKETS) {
      counts[b.id] = baseForTypeCounts.filter((c) =>
        comparisonMatchesTypes(c, new Set([b.id])),
      ).length;
    }
    return counts;
  }, [baseForTypeCounts]);

  const layoutCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of LAYOUT_BUCKETS) {
      counts[b.id] = baseForLayoutCounts.filter((c) =>
        comparisonMatchesLayouts(c, new Set([b.id])),
      ).length;
    }
    return counts;
  }, [baseForLayoutCounts]);

  // Navigate to a page, preserving every other query param (filters etc.).
  const goToPage = useCallback(
    (page: number) => {
      setSearchParams(pageParams(searchParams, page));
    },
    [searchParams, setSearchParams],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // A page beyond the last real page (but not page 1) is "out of range".
  const isOutOfRange = filtered.length > 0 && currentPage > totalPages;
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );
  const pageList = useMemo(
    () => buildPageList(currentPage, totalPages),
    [currentPage, totalPages],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Single source of truth for the filter query string. Syncs ?propertyTypes /
  // ?layouts to the active Sets, and drops ?page on a genuine filter change
  // (detected via the lastFilterSig ref) so a filter change resets to page 1.
  // One URLSearchParams, one setSearchParams — no two-effect race. The
  // idempotency guard makes it loop-safe and StrictMode-safe.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const typeStr = [...activePropertyTypes].sort().join(",");
    if (typeStr) next.set("propertyTypes", typeStr);
    else next.delete("propertyTypes");
    const layoutStr = [...activeLayouts].sort().join(",");
    if (layoutStr) next.set("layouts", layoutStr);
    else next.delete("layouts");
    if (filterSig !== lastFilterSig.current) {
      lastFilterSig.current = filterSig;
      next.delete("page");
    }
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [filterSig, activePropertyTypes, activeLayouts, searchParams, setSearchParams]);

  // SEO: emit rel="prev" / rel="next" link tags for the current page so
  // crawlers understand the paginated sequence. Cleaned up on unmount.
  useEffect(() => {
    const makeUrl = (page: number) => {
      const qs = pageParams(searchParams, page).toString();
      return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ""}`;
    };
    const links: HTMLLinkElement[] = [];
    const addLink = (rel: "prev" | "next", page: number) => {
      const el = document.createElement("link");
      el.rel = rel;
      el.href = makeUrl(page);
      document.head.appendChild(el);
      links.push(el);
    };
    if (currentPage > 1 && currentPage <= totalPages) addLink("prev", currentPage - 1);
    if (currentPage < totalPages) addLink("next", currentPage + 1);
    return () => links.forEach((el) => el.remove());
  }, [currentPage, totalPages, searchParams]);

  return (
    <div className="bg-paper text-ink">
      <div className="max-w-[1240px] mx-auto grid md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:block border-r border-rule p-6 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto">
          <FeedFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            activeAreas={activeAreas}
            setActiveAreas={setActiveAreas}
            activePrices={activePrices}
            setActivePrices={setActivePrices}
            activePropertyTypes={activePropertyTypes}
            setActivePropertyTypes={setActivePropertyTypes}
            activeLayouts={activeLayouts}
            setActiveLayouts={setActiveLayouts}
            typeCounts={typeCounts}
            layoutCounts={layoutCounts}
          />
        </aside>

        {/* Main */}
        <main className="px-5 sm:px-8 py-8">
          {/* Feed header */}
          <div className="sticky top-[52px] -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 bg-paper/95 backdrop-blur-md border-b border-rule mb-6 flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-[22px] tracking-[-0.3px]">
                比較レポート
              </h1>
              <Eyebrow size="sm" className="tracking-[0.08em]">
                {filtered.length} 件
              </Eyebrow>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="絞り込み"
                    className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 border border-rule rounded-md"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    絞り込み
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>絞り込み</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FeedFilters
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      activeAreas={activeAreas}
                      setActiveAreas={setActiveAreas}
                      activePrices={activePrices}
                      setActivePrices={setActivePrices}
                      activePropertyTypes={activePropertyTypes}
                      setActivePropertyTypes={setActivePropertyTypes}
                      activeLayouts={activeLayouts}
                      setActiveLayouts={setActiveLayouts}
                      typeCounts={typeCounts}
                      layoutCounts={layoutCounts}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "popular")}
                className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 bg-transparent border border-rule rounded-md px-2 py-1.5 cursor-pointer"
              >
                <option value="newest">新着順</option>
                <option value="popular">人気順</option>
              </select>
              <Button asChild variant="editorial" size="editorial-sm">
                <Link to="/compare">
                  <Plus className="w-3 h-3" />
                  新規比較
                </Link>
              </Button>
            </div>
          </div>

          {/* Expert claim banner */}
          <SurfaceCard
            tone="ink"
            pad="none"
            className="p-5 flex items-center justify-between gap-4 mb-6 flex-wrap"
          >
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] opacity-50 mb-1">
                認領待ち {comparisons.filter((c) => !c.experts || c.experts.length === 0).length} 件
              </div>
              <div className="font-display text-[18px] leading-[1.2]">
                専門家コメントを募集中のレポートがあります。
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-paper text-ink text-[12px] font-medium hover:opacity-85"
            >
              <Link to="/auth">認領する →</Link>
            </Button>
          </SurfaceCard>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border border-rule rounded-lg p-4 bg-white">
                  <div className="skel h-4 w-24 mb-3" />
                  <div className="skel h-5 w-3/4 mb-2" />
                  <div className="skel h-5 w-2/3 mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="skel h-16" />
                    <div className="skel h-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border border-rule rounded-lg p-4 bg-paper-dark flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-ink-60" />
              <span className="text-[13px] text-ink-60">{error}</span>
              <button
                onClick={() => setRefreshTrigger((p) => p + 1)}
                className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink underline"
              >
                再試行
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filtered.length === 0 && (
            <SurfaceCard pad="none" className="p-12 text-center">
              <Eyebrow size="sm" tone="muted" className="mb-3">
                Empty
              </Eyebrow>
              <h3 className="font-display text-[20px] tracking-[-0.3px] mb-2">
                まだ比較レポートがありません
              </h3>
              <p className="text-[13px] text-ink-60 mb-5">
                最初の比較を作成して、コミュニティに貢献しましょう。
              </p>
              <Button asChild variant="editorial" className="text-[13px]">
                <Link to="/compare">
                  <Plus className="w-4 h-4" />
                  比較を作成
                </Link>
              </Button>
            </SurfaceCard>
          )}

          {/* Out-of-range page */}
          {!isLoading && !error && isOutOfRange && (
            <SurfaceCard pad="none" className="p-12 text-center">
              <Eyebrow size="sm" tone="muted" className="mb-3">
                Not found
              </Eyebrow>
              <h3 className="font-display text-[20px] tracking-[-0.3px] mb-2">
                このページは存在しません
              </h3>
              <p className="text-[13px] text-ink-60 mb-5">
                指定されたページ {currentPage} は範囲外です（全 {totalPages} ページ）。
              </p>
              <Button
                variant="editorial"
                className="text-[13px]"
                onClick={() => goToPage(1)}
              >
                1ページ目に戻る
              </Button>
            </SurfaceCard>
          )}

          {/* Cards */}
          {!isLoading && !error && !isOutOfRange && filtered.length > 0 && (
            <>
              <div className="flex flex-col gap-px bg-rule border border-rule rounded-lg overflow-hidden">
                {pageItems.map((c, idx) => (
                  <FeedCard
                    key={c.id}
                    comparison={c}
                    index={(currentPage - 1) * PAGE_SIZE + idx}
                    animationIndex={idx}
                    formatPrice={formatPrice}
                    dateAgo={dateAgo}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageList={pageList}
                  onNavigate={goToPage}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const FeedCard = ({
  comparison,
  index,
  animationIndex,
  formatPrice,
  dateAgo,
}: {
  comparison: ComparisonPost;
  index: number;
  animationIndex: number;
  formatPrice: (p: number | null) => string;
  dateAgo: (iso: string) => string;
}) => {
  const expert = comparison.experts?.[0];
  const aPrice = comparison.propertyA.price_yen ?? 0;
  const bPrice = comparison.propertyB.price_yen ?? 0;
  // Naive winner heuristic for visual: cheaper price wins (placeholder until a
  // real score system exists). Translated into scores so <ReportCard> derives
  // the winner the same way it does for the Landing demo data.
  const winner: "A" | "B" | null = aPrice && bPrice ? (aPrice < bPrice ? "A" : "B") : null;
  const num = `#${(index + 1).toString().padStart(4, "0")}`;

  // Highlight pills: vote count plus the property type when available.
  const highlights: ReportCardHighlight[] = [];
  if (comparison.expertVotes !== undefined) {
    // Descriptive "専門家 N 票" label — the bare "票" glyph on its own reads as
    // a notdef artifact without context (mirrors the ReportCard save-count fix).
    highlights.push({ text: "専門家", strong: `${comparison.expertVotes} 票` });
  }
  if (comparison.propertyA.property_type) {
    highlights.push({ text: comparison.propertyA.property_type, strong: "" });
  }

  return (
    <ReportCard
      to={`/comparisons/${comparison.id}`}
      num={num}
      area={comparison.propertyA.floor_plan || "—"}
      date={dateAgo(comparison.created_at)} // relative-time may differ ~1 unit between SSR and client near a 24h boundary (pre-existing, acceptable)
      propertyA={{
        name: comparison.propertyA.property_name || "物件 A",
        price: formatPrice(comparison.propertyA.price_yen),
        score: winner === "A" ? 88 : 74,
      }}
      propertyB={{
        name: comparison.propertyB.property_name || "物件 B",
        price: formatPrice(comparison.propertyB.price_yen),
        score: winner === "B" ? 88 : 74,
      }}
      highlights={highlights}
      expert={expert ? { name: expert.name } : null}
      style={{ animation: `fade-in-up 0.4s ease ${animationIndex * 0.06}s both` }}
    />
  );
};

const PaginationControl = ({
  currentPage,
  totalPages,
  pageList,
  onNavigate,
}: {
  currentPage: number;
  totalPages: number;
  pageList: (number | "gap")[];
  onNavigate: (page: number) => void;
}) => {
  const baseBtn =
    "min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-md border text-[12px] transition-colors";
  return (
    <nav
      aria-label="ページネーション"
      className="mt-6 flex items-center justify-center gap-1.5 flex-wrap"
    >
      <button
        type="button"
        onClick={() => onNavigate(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${baseBtn} border-rule text-ink-60 hover:text-ink hover:bg-ink/[0.04] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-60`}
      >
        ← 前へ
      </button>
      {pageList.map((p, i) =>
        p === "gap" ? (
          <span
            key={`gap-${i}`}
            className="min-w-8 h-8 inline-flex items-center justify-center text-[12px] text-ink-60"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onNavigate(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`${baseBtn} tabular-nums ${
              p === currentPage
                ? "border-ink bg-ink text-paper"
                : "border-rule text-ink-60 hover:text-ink hover:bg-ink/[0.04]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onNavigate(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${baseBtn} border-rule text-ink-60 hover:text-ink hover:bg-ink/[0.04] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-60`}
      >
        次へ →
      </button>
    </nav>
  );
};

export default Feed;
