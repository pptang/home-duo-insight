import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Share, Calendar, MapPin, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useComparisonSubscription } from "@/hooks/use-comparison-subscription";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { RecommendationFeedback } from "@/components/RecommendationFeedback";
import {
  WinnerBanner,
  CompareTabs,
  ComparisonTable,
  AIAnalysisBlock,
  ProsConsGrid,
  ComingSoonTab,
} from "@/components/compare-result";
import type { ComparisonRow } from "@/components/compare-result";

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
  private_area_sqm: number | null;
  construction_year: number | null;
  construction_month: number | null;
  building_age_years: number | null;
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

const PROPERTY_FIELDS = [
  'id',
  'property_name',
  'address',
  'price_yen',
  'floor_plan',
  'commute_minutes',
  'property_type',
  'image_urls',
  'notes',
  'private_area_sqm',
  'construction_year',
  'construction_month',
  'building_age_years',
].join(', ');

type Tab = "summary" | "details" | "photos" | "map" | "risk";

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
            property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS}),
            property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS})`)
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
            property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS}),
            property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS}),
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

      {/* Hero banner */}
      <section className="max-w-[1040px] mx-auto px-6 pt-8">
        <div className="text-label-sm text-ink-60 mb-3">AI の判定</div>
        <WinnerBanner
          propertyA={{
            name: comparison.property_a.property_name || '物件 A',
            price: formatPrice(comparison.property_a.price_yen),
          }}
          propertyB={{
            name: comparison.property_b.property_name || '物件 B',
            price: formatPrice(comparison.property_b.price_yen),
          }}
          winner={winner}
        />
      </section>

      <CompareTabs
        tabs={[
          { id: 'summary', label: '概要比較' },
          { id: 'details', label: '詳細データ' },
          { id: 'photos', label: '写真' },
          { id: 'map', label: '地図・交通' },
          { id: 'risk', label: 'リスク分析' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      >
        {activeTab === 'summary' && (
          <SummaryTab comparison={comparison} recommendation={recommendation} />
        )}
        {activeTab === 'details' && (
          <DetailsTab comparison={comparison} formatPrice={formatPrice} />
        )}
        {activeTab === 'photos' && (
          <PhotosTab
            comparison={comparison}
            handleRetryImageExtraction={handleRetryImageExtraction}
          />
        )}
        {activeTab === 'map' && <MapTabPlaceholder />}
        {activeTab === 'risk' && <RiskTabPlaceholder />}

        {recommendation && activeTab === 'summary' && (
          <div className="mt-8">
            <RecommendationFeedback recommendationId={recommendation.id} />
          </div>
        )}
      </CompareTabs>

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

const SummaryTab = ({
  comparison,
  recommendation,
}: {
  comparison: ComparisonData;
  recommendation: AIRecommendation | null;
}) => {
  if (!recommendation) {
    return (
      <div className="border border-dashed border-rule rounded-lg p-12 text-center bg-paper-dark/40">
        <div className="text-label-sm text-ink-30 mb-2">Empty</div>
        <h3 className="text-property-name mb-2">
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

  const summaryRows: ComparisonRow[] = (recommendation.summary_table || []).map(
    (row, i) => ({
      key: `summary-${i}`,
      label: row.field,
      valueA: row.property_a,
      valueB: row.property_b,
    }),
  );

  return (
    <div className="space-y-8">
      <AIAnalysisBlock body={recommendation.final_recommendation} />
      {summaryRows.length > 0 && (
        <div>
          <div className="text-label-sm text-ink-60 mb-3">主要項目</div>
          <ComparisonTable
            rows={summaryRows}
            headerA={`A · ${comparison.property_a.property_name || '物件 A'}`}
            headerB={`B · ${comparison.property_b.property_name || '物件 B'}`}
          />
        </div>
      )}
      <ProsConsGrid
        a={{
          title: comparison.property_a.property_name || '物件 A',
          pros: recommendation.property_a_pros,
          cons: recommendation.property_a_cons,
        }}
        b={{
          title: comparison.property_b.property_name || '物件 B',
          pros: recommendation.property_b_pros,
          cons: recommendation.property_b_cons,
        }}
      />
    </div>
  );
};

const DetailsTab = ({
  comparison,
  formatPrice,
}: {
  comparison: ComparisonData;
  formatPrice: (p: number | null) => string;
}) => {
  const a = comparison.property_a;
  const b = comparison.property_b;

  const buildingAge = (p: PropertyData): string | null => {
    if (p.building_age_years != null) {
      const y = Math.floor(p.building_age_years);
      return y === 0 ? '新築' : `築${y}年`;
    }
    if (p.construction_year) {
      const month = p.construction_month ? `${p.construction_month}月` : '';
      return `${p.construction_year}年${month}竣工`;
    }
    return null;
  };

  const area = (p: PropertyData): string | null =>
    p.private_area_sqm != null ? `${p.private_area_sqm} ㎡` : null;

  const commute = (p: PropertyData): string | null =>
    p.commute_minutes != null ? `徒歩 ${p.commute_minutes} 分` : null;

  const rows: ComparisonRow[] = [
    { key: 'price', label: '価格', valueA: formatPrice(a.price_yen), valueB: formatPrice(b.price_yen), mono: true },
    { key: 'address', label: '住所', valueA: a.address, valueB: b.address },
    { key: 'floor', label: '間取り', valueA: a.floor_plan, valueB: b.floor_plan, mono: true },
    { key: 'area', label: '専有面積', valueA: area(a), valueB: area(b), mono: true },
    { key: 'age', label: '築年', valueA: buildingAge(a), valueB: buildingAge(b) },
    { key: 'commute', label: '通勤時間', valueA: commute(a), valueB: commute(b), mono: true },
    { key: 'type', label: '種別', valueA: a.property_type, valueB: b.property_type },
    { key: 'notes', label: 'メモ', valueA: a.notes, valueB: b.notes },
  ];

  return (
    <ComparisonTable
      rows={rows}
      headerA={`A · ${a.property_name || '物件 A'}`}
      headerB={`B · ${b.property_name || '物件 B'}`}
    />
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
        <div className="text-label-xs text-ink-60 mb-2">
          {i === 0 ? "物件 A" : "物件 B"}
        </div>
        <h3 className="text-property-name mb-4 truncate">
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

const MapTabPlaceholder = () => (
  <ComingSoonTab
    eyebrow="地図・交通"
    title="交通アクセスと周辺情報"
    description="最寄り駅・路線数・所要時間、および主要施設までの経路を可視化したマップを準備しています。公開情報と現地調査を組み合わせ、物件ごとのアクセス性を比較できるようにします。"
    icon={<MapPin className="w-4 h-4" />}
  />
);
const RiskTabPlaceholder = () => (
  <ComingSoonTab
    eyebrow="リスク分析"
    title="ハザードと将来リスクの可視化"
    description="洪水・液状化・土砂災害などのハザードマップ情報と、エリアの資産価値トレンドに基づく将来リスクを AI が整理し、2 物件を並べて比較できるようにします。"
    icon={<ShieldAlert className="w-4 h-4" />}
  />
);

export default ComparisonDetail;
