import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, dateAgo } from "@/lib/format";
import ReportCard, { type ReportCardHighlight } from "@/components/ui/ReportCard";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import FeedFilters from "@/components/FeedFilters";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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


const Feed = () => {
  const { t } = useTranslation();
  const [comparisons, setComparisons] = useState<ComparisonPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeAreas, setActiveAreas] = useState<Set<string>>(new Set());
  const [activePrices, setActivePrices] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  useEffect(() => {
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
              type VoteRow = {
                expert_user_id: string;
                expert_profiles?: { name?: string | null; profile_image_url?: string | null } | null;
              };
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

  const filtered = useMemo(() => {
    let list = comparisons;
    if (statusFilter === "expert") {
      list = list.filter((c) => (c.experts?.length ?? 0) > 0);
    } else if (statusFilter === "pending") {
      list = list.filter((c) => !c.experts || c.experts.length === 0);
    }
    if (sortBy === "popular") {
      list = [...list].sort((a, b) => (b.expertVotes ?? 0) - (a.expertVotes ?? 0));
    }
    return list;
  }, [comparisons, statusFilter, sortBy]);

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

          {/* Cards */}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="flex flex-col gap-px bg-rule border border-rule rounded-lg overflow-hidden">
              {filtered.map((c, idx) => (
                <FeedCard
                  key={c.id}
                  comparison={c}
                  index={idx}
                  formatPrice={formatPrice}
                  dateAgo={dateAgo}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const FeedCard = ({
  comparison,
  index,
  formatPrice,
  dateAgo,
}: {
  comparison: ComparisonPost;
  index: number;
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
      date={dateAgo(comparison.created_at)}
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
      style={{ animation: `fade-in-up 0.4s ease ${index * 0.06}s both` }}
    />
  );
};

export default Feed;
