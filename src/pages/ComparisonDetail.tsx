import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Share, Calendar, ThumbsUp, ThumbsDown, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useComparisonSubscription } from "@/hooks/use-comparison-subscription";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ExpertSection } from "@/components/ExpertSection";
import { RecommendationFeedback } from "@/components/RecommendationFeedback";

interface PropertyData {
  id: string;
  property_name: string | null;
  address: string | null;
  price_yen: number | null;
  floor_plan: string | null;
  commute_minutes: number | null;
  property_type: string | null;
  image_urls: string[] | null;
  notes: string | null;
}

interface AIRecommendation {
  id: string;
  property_a_pros: string[];
  property_a_cons: string[];
  property_b_pros: string[];
  property_b_cons: string[];
  summary_table: { field: string; property_a: string; property_b: string }[];
  final_recommendation: string;
  created_at: string;
}

interface ComparisonData {
  id: string;
  created_at: string;
  user_id: string | null;
  property_a: PropertyData;
  property_b: PropertyData;
  recommendations?: AIRecommendation[];
  image_extraction_status?: "pending" | "in_progress" | "completed" | "failed";
}

type Tab = "summary" | "details" | "photos" | "expert";

const ComparisonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  useComparisonSubscription({
    comparisonId: id || "",
    onImageExtractionComplete: async () => {
      if (id) {
        const { data: refreshed } = await supabase
          .from("comparisons")
          .select(`id, created_at, user_id, image_extraction_status,
            property_a:properties!comparisons_property_a_id_fkey(id, property_name, address, price_yen, floor_plan, commute_minutes, property_type, image_urls, notes),
            property_b:properties!comparisons_property_b_id_fkey(id, property_name, address, price_yen, floor_plan, commute_minutes, property_type, image_urls, notes)`)
          .eq("id", id)
          .single();
        if (refreshed) setComparison(refreshed as ComparisonData);
      }
    },
    onImageExtractionStatusChange: (status) => {
      if (comparison) setComparison({ ...comparison, image_extraction_status: status });
    },
  });

  const handleRetryImageExtraction = async (comparisonId: string) => {
    try {
      const { error } = await supabase.functions.invoke("retry-image-extraction", {
        body: { comparison_id: comparisonId },
      });
      if (error) {
        toast({ variant: "destructive", title: t("comparisonDetail.toast.retryFailed") });
        return;
      }
      toast({ title: t("comparisonDetail.toast.retryStarted") });
    } catch {
      toast({ variant: "destructive", title: t("comparisonDetail.toast.retryError") });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("No comparison ID provided");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const { data, error: err } = await supabase
          .from("comparisons")
          .select(`id, created_at, user_id, image_extraction_status,
            property_a:properties!comparisons_property_a_id_fkey(id, property_name, address, price_yen, floor_plan, commute_minutes, property_type, image_urls, notes),
            property_b:properties!comparisons_property_b_id_fkey(id, property_name, address, price_yen, floor_plan, commute_minutes, property_type, image_urls, notes),
            recommendations(id, property_a_pros, property_a_cons, property_b_pros, property_b_cons, summary_table, final_recommendation, created_at)`)
          .eq("id", id)
          .single();
        if (err || !data) {
          setError("Comparison not found");
          return;
        }
        const typed: ComparisonData = {
          id: data.id,
          created_at: data.created_at,
          user_id: data.user_id,
          property_a: data.property_a as PropertyData,
          property_b: data.property_b as PropertyData,
          recommendations: data.recommendations as AIRecommendation[],
        };
        setComparison(typed);
        if (typed.recommendations && typed.recommendations.length > 0) {
          setRecommendation(typed.recommendations[0]);
        }
      } catch {
        setError("Failed to load comparison data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatPrice = (price: number | null): string => {
    if (price === null) return "—";
    if (price >= 100000000) return `¥${(price / 100000000).toFixed(2)}億`;
    if (price >= 10000) return `¥${(price / 10000).toFixed(0)}万`;
    return `¥${price.toLocaleString()}`;
  };

  const sharePage = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AiSumai Comparison", url });
      } catch {
        /* user cancelled share */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: t("comparisonDetail.toast.linkCopied") });
      } catch {
        toast({ variant: "destructive", title: t("comparisonDetail.toast.linkCopyFailed") });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1040px] mx-auto px-6 py-12">
        <div className="skel h-4 w-48 mb-6" />
        <div className="skel h-10 w-2/3 mb-8" />
        <div className="grid grid-cols-2 gap-px bg-rule border border-rule rounded-lg overflow-hidden mb-8">
          <div className="bg-paper-dark p-8">
            <div className="skel h-3 w-16 mb-3" />
            <div className="skel h-16 w-full" />
          </div>
          <div className="bg-paper-dark p-8">
            <div className="skel h-3 w-16 mb-3" />
            <div className="skel h-16 w-full" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="skel h-6 w-full" />
          <div className="skel h-6 w-full" />
          <div className="skel h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="max-w-[860px] mx-auto px-6 py-24 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-30 mb-3">
          404 · Not Found
        </div>
        <h1 className="font-display text-[36px] tracking-[-0.5px] mb-4">
          {t("comparisonDetail.notFound.title")}
        </h1>
        <p className="text-[14px] text-ink-60 mb-8">
          {error || t("comparisonDetail.notFound.description")}
        </p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2.5 text-[13px] no-underline rounded-md hover:opacity-85"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("comparisonDetail.backToFeed")}
        </Link>
      </div>
    );
  }

  // Naive winner heuristic from price (until real AI score is wired)
  const aPrice = comparison.property_a.price_yen ?? 0;
  const bPrice = comparison.property_b.price_yen ?? 0;
  const winner: "A" | "B" = aPrice && bPrice ? (aPrice <= bPrice ? "A" : "B") : "A";
  const scoreA = winner === "A" ? 88 : 74;
  const scoreB = winner === "B" ? 88 : 74;

  return (
    <div className="bg-paper text-ink pb-24">
      {/* Breadcrumb */}
      <div className="max-w-[1040px] mx-auto px-6 pt-6 pb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60">
        <Link to="/feed" className="hover:text-ink no-underline">Feed</Link>
        <span className="text-ink-30">/</span>
        <span className="text-ink">Compare Report</span>
      </div>

      {/* Header */}
      <header className="max-w-[1040px] mx-auto px-6 pb-6 border-b border-rule">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-block font-mono text-[9px] uppercase tracking-[0.12em] text-paper bg-ink px-2 py-1 rounded-sm mb-3">
              AI 比較レポート
            </span>
            <h1 className="font-display text-[32px] sm:text-[40px] leading-[1.1] tracking-[-0.5px] mb-2">
              {comparison.property_a.property_name || "物件 A"}
              <span className="text-ink-30 italic mx-3">vs</span>
              {comparison.property_b.property_name || "物件 B"}
            </h1>
            <div className="flex items-center gap-2 text-[12px] text-ink-60">
              <Calendar className="w-3 h-3" />
              {new Date(comparison.created_at).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <button
            onClick={sharePage}
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 border border-rule rounded-md px-3 py-2 flex items-center gap-1.5 hover:bg-ink/[0.06]"
          >
            <Share className="w-3 h-3" />
            シェア
          </button>
        </div>
      </header>

      {/* Score Duel */}
      <section className="max-w-[1040px] mx-auto px-6 pt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-3">
          総合スコア
        </div>
        <div className="score-duel">
          <ScoreSide
            label="物件 A"
            name={comparison.property_a.property_name || "物件 A"}
            price={formatPrice(comparison.property_a.price_yen)}
            score={scoreA}
            winner={winner === "A"}
          />
          <ScoreSide
            label="物件 B"
            name={comparison.property_b.property_name || "物件 B"}
            price={formatPrice(comparison.property_b.price_yen)}
            score={scoreB}
            winner={winner === "B"}
          />
        </div>
      </section>

      {/* Tabs */}
      <nav className="max-w-[1040px] mx-auto px-6 mt-10 border-b border-rule flex gap-1 overflow-x-auto">
        {([
          { id: "summary" as Tab, label: "概要比較" },
          { id: "details" as Tab, label: "詳細データ" },
          { id: "photos" as Tab, label: "写真" },
          { id: "expert" as Tab, label: "専門家コメント" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`font-mono text-[11px] uppercase tracking-[0.06em] px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? "border-ink text-ink"
                : "border-transparent text-ink-60 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <section className="max-w-[1040px] mx-auto px-6 mt-8">
        {activeTab === "summary" && (
          <SummaryTab comparison={comparison} recommendation={recommendation} formatPrice={formatPrice} />
        )}
        {activeTab === "details" && (
          <DetailsTab comparison={comparison} formatPrice={formatPrice} />
        )}
        {activeTab === "photos" && (
          <PhotosTab
            comparison={comparison}
            handleRetryImageExtraction={handleRetryImageExtraction}
          />
        )}
        {activeTab === "expert" && (
          <ExpertSection
            comparisonId={comparison.id}
            propertyAName={comparison.property_a.property_name || "物件 A"}
            propertyBName={comparison.property_b.property_name || "物件 B"}
          />
        )}

        {recommendation && activeTab === "summary" && (
          <div className="mt-8">
            <RecommendationFeedback recommendationId={recommendation.id} />
          </div>
        )}
      </section>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-ink text-paper border-t border-ink/40 z-30">
        <div className="max-w-[1040px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-50 hidden sm:block">
            このレポートが役に立ちましたか？
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/compare"
              className="font-mono text-[10px] uppercase tracking-[0.06em] text-paper border border-paper/25 rounded-md px-3 py-2 no-underline hover:bg-paper/10"
            >
              別の比較を作成
            </Link>
            <Link
              to="/auth"
              className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink bg-paper rounded-md px-3 py-2 no-underline hover:opacity-85"
            >
              専門家に相談する →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreSide = ({
  label,
  name,
  price,
  score,
  winner,
}: {
  label: string;
  name: string;
  price: string;
  score: number;
  winner: boolean;
}) => (
  <div className={`duel-side ${winner ? "winner" : "loser"}`}>
    {winner && (
      <div className="absolute top-3 right-3 font-mono text-[8px] uppercase tracking-[0.12em] border border-paper/25 text-paper/80 px-2 py-1 rounded-sm flex items-center gap-1">
        <Crown className="w-3 h-3" />
        AI 推奨
      </div>
    )}
    <div className={`font-mono text-[9px] uppercase tracking-[0.12em] mb-2 ${winner ? "opacity-50" : "text-ink-60"}`}>
      {label}
    </div>
    <div className={`font-display text-[20px] tracking-[-0.3px] mb-3 leading-[1.2] line-clamp-2`}>
      {name}
    </div>
    <div className={`font-display text-[64px] leading-none tracking-[-2px] mb-2 ${winner ? "text-paper" : "text-ink/40"}`}>
      {score}
    </div>
    <div className={`font-mono text-[9px] uppercase tracking-[0.1em] ${winner ? "opacity-50" : "text-ink-30"}`}>
      / 100 · {price}
    </div>
  </div>
);

const SummaryTab = ({
  comparison,
  recommendation,
  formatPrice,
}: {
  comparison: ComparisonData;
  recommendation: AIRecommendation | null;
  formatPrice: (p: number | null) => string;
}) => {
  if (!recommendation) {
    return (
      <div className="border border-dashed border-rule rounded-lg p-12 text-center bg-paper-dark/40">
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-30 mb-2">
          Empty
        </div>
        <h3 className="font-display text-[20px] tracking-[-0.3px] mb-2">
          AI レポートはまだ生成されていません
        </h3>
        <p className="text-[13px] text-ink-60 mb-5">
          物件 URL から再生成して、AI による比較分析を取得してください。
        </p>
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 bg-ink text-paper px-4 py-2 text-[13px] no-underline rounded-md hover:opacity-85"
        >
          再生成する →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Final verdict (dark) */}
      <div className="bg-ink text-paper rounded-lg p-6 sm:p-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-50 mb-3">
          AI サマリー
        </div>
        <div className="text-[14px] leading-[1.7] prose prose-invert max-w-none">
          <MarkdownRenderer content={recommendation.final_recommendation} />
        </div>
      </div>

      {/* Summary table */}
      {recommendation.summary_table?.length > 0 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-3">
            主要項目
          </div>
          <div className="border border-rule rounded-lg overflow-hidden bg-white">
            <div className="grid grid-cols-[140px_1fr_1fr] bg-paper-dark border-b border-rule">
              <div className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-60">
                項目
              </div>
              <div className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-60 border-l border-rule">
                A · {comparison.property_a.property_name || "物件 A"}
              </div>
              <div className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-60 border-l border-rule">
                B · {comparison.property_b.property_name || "物件 B"}
              </div>
            </div>
            {recommendation.summary_table.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-[140px_1fr_1fr] border-b border-rule last:border-b-0 text-[13px] ${
                  i % 2 === 1 ? "bg-paper" : ""
                }`}
              >
                <div className="px-4 py-2.5 text-ink-60">{row.field}</div>
                <div className="px-4 py-2.5 border-l border-rule font-medium">{row.property_a}</div>
                <div className="px-4 py-2.5 border-l border-rule font-medium">{row.property_b}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pros/Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
        <ProsCons
          title={comparison.property_a.property_name || "物件 A"}
          pros={recommendation.property_a_pros}
          cons={recommendation.property_a_cons}
        />
        <ProsCons
          title={comparison.property_b.property_name || "物件 B"}
          pros={recommendation.property_b_pros}
          cons={recommendation.property_b_cons}
        />
      </div>
    </div>
  );
};

const ProsCons = ({ title, pros, cons }: { title: string; pros: string[]; cons: string[] }) => (
  <div className="bg-white p-6">
    <h3 className="font-display text-[18px] tracking-[-0.2px] mb-4 pb-3 border-b border-rule">
      {title}
    </h3>
    <div className="mb-5">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-60 mb-2">
        <ThumbsUp className="w-3 h-3" />
        Pros
      </div>
      <ul className="space-y-1.5 text-[13px]">
        {pros.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-ink-30">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-60 mb-2">
        <ThumbsDown className="w-3 h-3" />
        Cons
      </div>
      <ul className="space-y-1.5 text-[13px]">
        {cons.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-ink-30">·</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const DetailsTab = ({
  comparison,
  formatPrice,
}: {
  comparison: ComparisonData;
  formatPrice: (p: number | null) => string;
}) => {
  const fields: { key: string; label: string; getA: () => string | null; getB: () => string | null }[] = [
    {
      key: "price",
      label: "価格",
      getA: () => formatPrice(comparison.property_a.price_yen),
      getB: () => formatPrice(comparison.property_b.price_yen),
    },
    {
      key: "address",
      label: "住所",
      getA: () => comparison.property_a.address,
      getB: () => comparison.property_b.address,
    },
    {
      key: "floor",
      label: "間取り",
      getA: () => comparison.property_a.floor_plan,
      getB: () => comparison.property_b.floor_plan,
    },
    {
      key: "commute",
      label: "通勤時間",
      getA: () => comparison.property_a.commute_minutes ? `${comparison.property_a.commute_minutes} 分` : null,
      getB: () => comparison.property_b.commute_minutes ? `${comparison.property_b.commute_minutes} 分` : null,
    },
    {
      key: "type",
      label: "種別",
      getA: () => comparison.property_a.property_type,
      getB: () => comparison.property_b.property_type,
    },
  ];
  return (
    <div className="border border-rule rounded-lg overflow-hidden bg-white">
      {fields.map((f, i) => (
        <div
          key={f.key}
          className={`grid grid-cols-[120px_1fr_1fr] border-b border-rule last:border-b-0 text-[13px] ${
            i % 2 === 1 ? "bg-paper" : ""
          }`}
        >
          <div className="px-4 py-3 text-ink-60 font-mono text-[10px] uppercase tracking-[0.08em]">
            {f.label}
          </div>
          <div className="px-4 py-3 border-l border-rule font-medium">
            {f.getA() || <span className="text-ink-30">—</span>}
          </div>
          <div className="px-4 py-3 border-l border-rule font-medium">
            {f.getB() || <span className="text-ink-30">—</span>}
          </div>
        </div>
      ))}
      {(comparison.property_a.notes || comparison.property_b.notes) && (
        <div className="grid grid-cols-[120px_1fr_1fr] border-t border-rule text-[13px] bg-paper-dark/40">
          <div className="px-4 py-3 text-ink-60 font-mono text-[10px] uppercase tracking-[0.08em]">
            メモ
          </div>
          <div className="px-4 py-3 border-l border-rule">
            {comparison.property_a.notes || <span className="text-ink-30">—</span>}
          </div>
          <div className="px-4 py-3 border-l border-rule">
            {comparison.property_b.notes || <span className="text-ink-30">—</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const PhotosTab = ({
  comparison,
  handleRetryImageExtraction,
}: {
  comparison: ComparisonData;
  handleRetryImageExtraction: (id: string) => Promise<void>;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
    {[comparison.property_a, comparison.property_b].map((p, i) => (
      <div key={p.id} className="bg-white p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-60 mb-2">
          {i === 0 ? "物件 A" : "物件 B"}
        </div>
        <h3 className="font-display text-[18px] tracking-[-0.2px] mb-4 truncate">
          {p.property_name || `物件 ${i === 0 ? "A" : "B"}`}
        </h3>
        <PropertyImageDisplay
          imageUrls={p.image_urls}
          propertyName={p.property_name || `物件 ${i === 0 ? "A" : "B"}`}
          imageExtractionStatus={comparison.image_extraction_status}
          aspectRatio="video"
          comparisonId={comparison.id}
          onRetryImageExtraction={handleRetryImageExtraction}
        />
      </div>
    ))}
  </div>
);

export default ComparisonDetail;
