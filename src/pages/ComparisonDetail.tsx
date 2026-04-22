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
  ExpertSectionPanel,
  SimilarProperties,
  ScoreCardsGrid,
} from "@/components/compare-result";
import type { ComparisonRow, AxisScores } from "@/components/compare-result";

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
  // tv7.13 fields
  building_structure?: string | null;
  total_units?: number | null;
  management_type?: string | null;
  parking?: string | null;
  amenities?: Record<string, unknown> | null;
  pet_allowed?: boolean | null;
  estimated_rent?: number | null;
  estimated_yield?: number | null;
  seismic_standard?: string | null;
  school_district?: string | null;
}

interface AIRecommendation {
  id: string;
  property_a_pros: string[];
  property_a_cons: string[];
  property_b_pros: string[];
  property_b_cons: string[];
  summary_table: {
    field: string;
    property_a: string;
    property_b: string;
    winner?: "A" | "B" | "draw";
    badge?: string;
  }[];
  final_recommendation: string;
  created_at: string;
  // tv7.10
  ai_points?: { kind: "pro-a" | "pro-b" | "caution"; body: string }[] | null;
  // tv7.2: per-axis scores emitted by generate-recommendation
  score_breakdown?: { a: AxisScores; b: AxisScores } | null;
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

// Base fields that exist on the properties table before wave-2 migrations
const PROPERTY_FIELDS_BASE = [
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

// Extended fields added by wave-2 migrations (tv7.13)
const PROPERTY_FIELDS_EXTENDED = [
  ...PROPERTY_FIELDS_BASE.split(', '),
  'building_structure',
  'total_units',
  'management_type',
  'parking',
  'amenities',
  'pet_allowed',
  'estimated_rent',
  'estimated_yield',
  'seismic_standard',
  'school_district',
].join(', ');

/** Returns true when the PostgREST error is a missing column (code 42703) */
const is42703 = (err: { code?: string; message?: string } | null): boolean =>
  !!err && (err.code === '42703' || (err.message ?? '').includes('does not exist'));

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
  // tv7.17: PDF print state
  const [isPrinting, setIsPrinting] = useState(false);

  // tv7.17: inject print CSS on mount, clean up on unmount
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'aisumai-print-css';
    style.textContent = [
      '@media print {',
      '  .no-print { display: none !important; }',
      '  body { padding-bottom: 0 !important; }',
      '}',
    ].join('\n');
    if (!document.getElementById('aisumai-print-css')) {
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById('aisumai-print-css');
      if (el) el.remove();
    };
  }, []);

  useComparisonSubscription({
    comparisonId: id || "",
    onImageExtractionComplete: async () => {
      if (id) {
        const { data: refreshed } = await supabase
          .from("comparisons")
          .select(`id, created_at, user_id, image_extraction_status,
            property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS_EXTENDED}),
            property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS_EXTENDED})`)
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

  // tv7.17: trigger browser print dialog (window.print = zero-dep PDF approach)
  const handlePrint = () => {
    setIsPrinting(true);
    // window.print() is synchronous; restore state after dialog closes
    window.print();
    setTimeout(() => {
      setIsPrinting(false);
      toast({ title: "PDFを保存しました" });
    }, 500);
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

        // Attempt 1: extended property fields + ai_points
        let { data, error: err } = await supabase
          .from("comparisons")
          .select(`id, created_at, user_id, image_extraction_status,
            property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS_EXTENDED}),
            property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS_EXTENDED}),
            recommendations(id, property_a_pros, property_a_cons, property_b_pros, property_b_cons, summary_table, final_recommendation, created_at, ai_points, score_breakdown)`)
          .eq("id", id)
          .single();

        // Fallback 1: extended property columns missing — retry with base fields but keep ai_points
        if (is42703(err)) {
          console.warn('[ComparisonDetail] Extended property columns missing (42703) — falling back to base fields');
          ({ data, error: err } = await supabase
            .from("comparisons")
            .select(`id, created_at, user_id, image_extraction_status,
              property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS_BASE}),
              property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS_BASE}),
              recommendations(id, property_a_pros, property_a_cons, property_b_pros, property_b_cons, summary_table, final_recommendation, created_at, ai_points, score_breakdown)`)
            .eq("id", id)
            .single());
        }

        // Fallback 2: ai_points column also missing — retry without it
        if (is42703(err)) {
          console.warn('[ComparisonDetail] ai_points column missing (42703) — falling back without ai_points');
          ({ data, error: err } = await supabase
            .from("comparisons")
            .select(`id, created_at, user_id, image_extraction_status,
              property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS_BASE}),
              property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS_BASE}),
              recommendations(id, property_a_pros, property_a_cons, property_b_pros, property_b_cons, summary_table, final_recommendation, created_at)`)
            .eq("id", id)
            .single());
        }

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

  // tv7.18: derive winner name for the verdict line in the sticky bar
  const winnerName =
    winner === "A"
      ? comparison.property_a.property_name || "物件 A"
      : comparison.property_b.property_name || "物件 B";

  return (
    <div className="bg-paper text-ink pb-24">
      {/* Breadcrumb — hidden in print (tv7.17) */}
      <div className="no-print max-w-[1040px] mx-auto px-6 pt-6 pb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60">
        <Link to="/" className="hover:text-ink no-underline">Home</Link>
        <span className="text-ink-30">/</span>
        <Link to="/feed" className="hover:text-ink no-underline">比較</Link>
        <span className="text-ink-30">/</span>
        <span className="text-ink">{comparison.property_a.property_name || "物件 A"} vs {comparison.property_b.property_name || "物件 B"}</span>
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

      <SimilarProperties
        propertyAId={comparison.property_a.id}
        propertyBId={comparison.property_b.id}
        propertyAAddress={comparison.property_a.address}
        propertyBAddress={comparison.property_b.address}
        propertyAPriceYen={comparison.property_a.price_yen}
        propertyBPriceYen={comparison.property_b.price_yen}
      />

      <ExpertSectionPanel
        comparisonId={comparison.id}
        propertyAName={comparison.property_a.property_name || '物件 A'}
        propertyBName={comparison.property_b.property_name || '物件 B'}
      />

      {/* Sticky action bar — tv7.18: translucent paper/90 + backdrop-blur + shadow-drawer + verdict line
          tv7.17: PDF保存 button via window.print()
          Hidden during print via .no-print class */}
      <div className="no-print fixed bottom-0 left-0 right-0 bg-paper/90 backdrop-blur-md border-t border-rule shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-30">
        <div className="max-w-[1040px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
          {/* tv7.18: verdict line */}
          <div className="flex items-center gap-1.5 text-ink min-w-0 overflow-hidden">
            <span className="text-[13px] font-medium truncate hidden sm:block">
              {comparison.property_a.property_name || "物件 A"}
            </span>
            <span className="text-ink-30 text-[10px] hidden sm:block">vs</span>
            <span className="text-[13px] font-medium truncate hidden sm:block">
              {comparison.property_b.property_name || "物件 B"}
            </span>
            <span className="font-mono text-[10px] text-ink-60 ml-2 whitespace-nowrap hidden sm:block">
              — AI推奨: {winnerName}
            </span>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/compare"
              className="text-label-md text-ink border border-rule rounded-md px-3 py-2 no-underline hover:bg-ink/[0.06] transition-colors duration-fast"
            >
              別の比較を作成
            </Link>
            {/* tv7.17: PDF保存 button — uses window.print() as pragmatic zero-dep approach */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="text-label-md text-ink border border-rule rounded-md px-3 py-2 hover:bg-ink/[0.06] transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPrinting ? "生成中…" : "PDF保存"}
            </button>
            <Link
              to="/auth"
              className="text-label-md text-paper bg-ink rounded-md px-3 py-2 no-underline hover:opacity-85 transition-opacity duration-fast"
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
        <h2 className="text-property-name mb-2">
          AI レポートはまだ生成されていません
        </h2>
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

  // tv7.7: pass winner/badgeLabel through from summary_table rows
  const summaryRows: ComparisonRow[] = (recommendation.summary_table || []).map(
    (row, i) => ({
      key: `summary-${i}`,
      label: row.field,
      valueA: row.property_a,
      valueB: row.property_b,
      winner: row.winner,
      badgeLabel: row.badge,
    }),
  );

  // tv7.10: map ai_points body→text for AIAnalysisBlock
  const aiPoints = (recommendation.ai_points || []).map((p) => ({
    kind: p.kind,
    text: p.body,
  }));

  return (
    <div className="space-y-8">
      <h2 className="sr-only">比較サマリー</h2>
      {recommendation.score_breakdown && (
        <ScoreCardsGrid
          scoresA={recommendation.score_breakdown.a}
          scoresB={recommendation.score_breakdown.b}
          propertyAName={comparison.property_a.property_name || '物件 A'}
          propertyBName={comparison.property_b.property_name || '物件 B'}
        />
      )}
      {/* tv7.10: pass points, modelBadge, disclaimer */}
      <AIAnalysisBlock
        body={recommendation.final_recommendation}
        points={aiPoints}
        modelBadge={import.meta.env.VITE_AI_MODEL_NAME || 'Claude Sonnet 4'}
        disclaimer="AI による分析です。最終決定は専門家や実物件確認と合わせて行ってください。"
      />
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

// tv7.13: helper functions for DetailsTab
const boolToMaru = (v: boolean | null | undefined): string | null =>
  v === null || v === undefined ? null : v ? '○' : '—';

const boolToPossible = (v: boolean | null | undefined): string | null =>
  v === null || v === undefined ? null : v ? '可' : '不可';

const rentStr = (p: PropertyData): string | null =>
  p.estimated_rent != null ? `${p.estimated_rent}万円` : null;

const yieldStr = (p: PropertyData): string | null =>
  p.estimated_yield != null ? `${p.estimated_yield}%` : null;

const DetailsTab = ({
  comparison,
  formatPrice: _formatPrice,
}: {
  comparison: ComparisonData;
  formatPrice: (p: number | null) => string;
}) => {
  const a = comparison.property_a;
  const b = comparison.property_b;

  // tv7.13: 14-row canonical table
  const rows: ComparisonRow[] = [
    {
      key: 'building_structure',
      label: '建物構造',
      valueA: a.building_structure ?? null,
      valueB: b.building_structure ?? null,
    },
    {
      key: 'total_units',
      label: '総戸数',
      valueA: a.total_units != null ? String(a.total_units) : null,
      valueB: b.total_units != null ? String(b.total_units) : null,
      mono: true,
    },
    {
      key: 'management_type',
      label: '管理形態',
      valueA: a.management_type ?? null,
      valueB: b.management_type ?? null,
    },
    {
      key: 'parking',
      label: '駐車場',
      valueA: a.parking ?? null,
      valueB: b.parking ?? null,
    },
    {
      key: 'delivery_box',
      label: '宅配ボックス',
      valueA: boolToMaru((a.amenities as { delivery_box?: boolean } | null | undefined)?.delivery_box),
      valueB: boolToMaru((b.amenities as { delivery_box?: boolean } | null | undefined)?.delivery_box),
    },
    {
      key: 'concierge',
      label: 'コンシェルジュ',
      valueA: boolToMaru((a.amenities as { concierge?: boolean } | null | undefined)?.concierge),
      valueB: boolToMaru((b.amenities as { concierge?: boolean } | null | undefined)?.concierge),
    },
    {
      key: 'pet_allowed',
      label: 'ペット可',
      valueA: boolToPossible(a.pet_allowed),
      valueB: boolToPossible(b.pet_allowed),
    },
    {
      key: 'foreigner_purchase',
      label: '外国人購入',
      valueA: (() => {
        const v = (a.amenities as { foreigner_purchase?: boolean } | null | undefined)?.foreigner_purchase;
        return v === undefined || v === null ? null : v ? '可' : '不可';
      })(),
      valueB: (() => {
        const v = (b.amenities as { foreigner_purchase?: boolean } | null | undefined)?.foreigner_purchase;
        return v === undefined || v === null ? null : v ? '可' : '不可';
      })(),
    },
    {
      key: 'investment_allowed',
      label: '投資・賃貸利用',
      valueA: (() => {
        const v = (a.amenities as { investment_allowed?: boolean } | null | undefined)?.investment_allowed;
        return v === undefined || v === null ? null : v ? '可' : '不可';
      })(),
      valueB: (() => {
        const v = (b.amenities as { investment_allowed?: boolean } | null | undefined)?.investment_allowed;
        return v === undefined || v === null ? null : v ? '可' : '不可';
      })(),
    },
    {
      key: 'estimated_rent',
      label: '想定賃料',
      valueA: rentStr(a),
      valueB: rentStr(b),
      mono: true,
    },
    {
      key: 'estimated_yield',
      label: '想定表面利回り',
      valueA: yieldStr(a),
      valueB: yieldStr(b),
      mono: true,
    },
    {
      key: 'seismic_standard',
      label: '耐震基準',
      valueA: a.seismic_standard ?? null,
      valueB: b.seismic_standard ?? null,
    },
    {
      key: 'hazard_map',
      label: 'ハザードマップ',
      valueA: (a.amenities as { hazard_map?: string } | null | undefined)?.hazard_map ?? null,
      valueB: (b.amenities as { hazard_map?: string } | null | undefined)?.hazard_map ?? null,
    },
    {
      key: 'school_district',
      label: '小学校区',
      valueA: a.school_district ?? null,
      valueB: b.school_district ?? null,
    },
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
