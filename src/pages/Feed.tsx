import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, dateAgo } from "@/lib/format";
import ReportCard, { type ReportCardHighlight } from "@/components/ui/ReportCard";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

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

const STATUS_FILTERS = [
  { id: "all", label: "すべて" },
  { id: "expert", label: "専門家コメント済み" },
  { id: "pending", label: "コメント待ち" },
];

const AREA_FILTERS = [
  { id: "tokyo", label: "東京" },
  { id: "osaka", label: "大阪" },
  { id: "nagoya", label: "名古屋" },
  { id: "yokohama", label: "横浜" },
];

const PRICE_FILTERS = [
  { id: "p1", label: "〜3,000万" },
  { id: "p2", label: "3,000〜6,000万" },
  { id: "p3", label: "6,000〜1億" },
  { id: "p4", label: "1億〜" },
];

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

  const toggleSet = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <div className="bg-paper text-ink">
      <div className="max-w-[1240px] mx-auto grid md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:block border-r border-rule p-6 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto">
          <FilterGroup title="ステータス">
            {STATUS_FILTERS.map((s) => (
              <FilterOption
                key={s.id}
                label={s.label}
                active={statusFilter === s.id}
                onClick={() => setStatusFilter(s.id)}
                radio
              />
            ))}
          </FilterGroup>

          <FilterGroup title="エリア">
            {AREA_FILTERS.map((a) => (
              <FilterOption
                key={a.id}
                label={a.label}
                active={activeAreas.has(a.id)}
                onClick={() => toggleSet(activeAreas, a.id, setActiveAreas)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="価格帯">
            {PRICE_FILTERS.map((p) => (
              <FilterOption
                key={p.id}
                label={p.label}
                active={activePrices.has(p.id)}
                onClick={() => toggleSet(activePrices, p.id, setActivePrices)}
              />
            ))}
          </FilterGroup>

          <SurfaceCard tone="paper-dark" pad="sm" className="mt-8">
            <Eyebrow size="sm" className="mb-2">
              専門家の方へ
            </Eyebrow>
            <div className="font-display text-[16px] tracking-[-0.2px] mb-2 leading-[1.2]">
              レポートを認領
            </div>
            <p className="text-[12px] text-ink-60 leading-relaxed mb-3">
              あなたの専門知識でユーザーをサポート。
            </p>
            <Button asChild variant="editorial" size="editorial-sm">
              <Link to="/auth">専門家として登録</Link>
            </Button>
          </SurfaceCard>
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

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-60 pb-2 mb-2 border-b border-rule">
      {title}
    </div>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
);

const FilterOption = ({
  label,
  active,
  onClick,
  radio = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  radio?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 text-left px-2 py-1.5 rounded text-[12px] transition-colors ${
      active ? "bg-ink text-paper" : "text-ink-60 hover:text-ink hover:bg-ink/[0.04]"
    }`}
  >
    <span
      className={`w-3.5 h-3.5 ${radio ? "rounded-full" : "rounded-sm"} border ${
        active ? "border-paper bg-paper" : "border-rule bg-transparent"
      } flex items-center justify-center`}
    >
      {active && (
        <span className={`block ${radio ? "w-1.5 h-1.5 rounded-full bg-ink" : "w-2 h-2 bg-ink"}`} />
      )}
    </span>
    {label}
  </button>
);

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
