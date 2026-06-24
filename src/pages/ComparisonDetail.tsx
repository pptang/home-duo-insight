import { useEffect, useState } from "react";
import { Link, useLoaderData, data, useRouteError, isRouteErrorResponse } from "react-router";
import type { LoaderFunctionArgs, MetaArgs, HeadersArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Share, Calendar, MapPin, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, OG_IMAGE_URL, SITE_TITLE } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useComparisonSubscription } from "@/hooks/use-comparison-subscription";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { RecommendationFeedback } from "@/components/RecommendationFeedback";
import {
  WinnerBanner,
  CompareTabs,
  ComparisonTable,
  AIAnalysisBlock,
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
  summary_table: {
    field: string;
    property_a: string;
    property_b: string;
    winner?: "A" | "B" | "draw";
    badge?: string;
  }[];
  final_recommendation: string;
  created_at: string;
  // bead home-duo-insight-elg: authored language of this report ('en' | 'ja'),
  // fixed at generation time. NULL for pre-migration rows (treated as unknown).
  language?: string | null;
  // tv7.10
  ai_points?: { kind: "pro-a" | "pro-b" | "caution"; body: string }[] | null;
  // tv7.2: per-axis scores emitted by generate-recommendation
  score_breakdown?: { a: AxisScores; b: AxisScores } | null;
  // tv7.eod: score totals used for the sticky-bar verdict
  property_a_score_total?: number | null;
  property_b_score_total?: number | null;
}

interface ComparisonData {
  id: string;
  created_at: string;
  user_id: string | null;
  property_a: PropertyData;
  property_b: PropertyData;
  recommendations?: AIRecommendation[];
  image_extraction_status?: "pending" | "in_progress" | "completed" | "failed";
  view_count?: number;
  save_count?: number;
}

// Property fields including wave-2 migration additions (tv7.13)
const PROPERTY_FIELDS_EXTENDED = [
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

type Tab = "summary" | "details" | "photos" | "map" | "risk";

// formatPrice is imported from @/lib/format (shared with Feed.tsx / Dashboard.tsx).
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// Loader payload shape — the loader wraps this in data() to attach Cache-Control,
// so meta() casts to this rather than Awaited<ReturnType<typeof loader>>.
type LoaderData = {
  comparison: ComparisonData;
  recommendation: AIRecommendation | null;
  seo: { title: string; description: string; url: string };
};

// --- SSR loader ---

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    throw data("Comparison not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const { data: row, error } = await supabase
    .from("comparisons")
    .select(`id, created_at, user_id, image_extraction_status, view_count, save_count,
      property_a:properties!comparisons_property_a_id_fkey(${PROPERTY_FIELDS_EXTENDED}),
      property_b:properties!comparisons_property_b_id_fkey(${PROPERTY_FIELDS_EXTENDED}),
      recommendations(id, summary_table, final_recommendation, created_at, ai_points, score_breakdown, property_a_score_total, property_b_score_total, language)`)
    .eq("id", id)
    .single();

  if (error || !row) {
    throw data("Comparison not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const comparison: ComparisonData = {
    id: row.id,
    created_at: row.created_at,
    user_id: row.user_id,
    property_a: row.property_a as PropertyData,
    property_b: row.property_b as PropertyData,
    recommendations: row.recommendations as AIRecommendation[],
    image_extraction_status: (row as { image_extraction_status?: ComparisonData["image_extraction_status"] }).image_extraction_status,
    view_count: (row as { view_count?: number }).view_count,
    save_count: (row as { save_count?: number }).save_count,
  };

  // Pick the newest recommendation server-side (same logic as the old client sort).
  const recommendation: AIRecommendation | null =
    comparison.recommendations && comparison.recommendations.length > 0
      ? [...comparison.recommendations].sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        )[0]
      : null;

  // Build per-pair SEO strings server-side.
  const aName = comparison.property_a.property_name || "物件 A";
  const bName = comparison.property_b.property_name || "物件 B";
  const aPlan = comparison.property_a.floor_plan ? ` ${comparison.property_a.floor_plan}` : "";
  const bPlan = comparison.property_b.floor_plan ? ` ${comparison.property_b.floor_plan}` : "";
  const aPriceStr = formatPrice(comparison.property_a.price_yen);
  const bPriceStr = formatPrice(comparison.property_b.price_yen);
  const seoTitle = truncate(
    `${aName}${aPlan} vs ${bName}${bPlan} — Property Comparison | AiSumai`,
    60,
  );
  const seoDescription = truncate(
    `AI analysis of ${aName} (${aPriceStr}) vs ${bName} (${bPriceStr}). Compare price, commute, and resale outlook on AiSumai.`,
    160,
  );
  const seoUrl = `${SITE_URL}/comparisons/${comparison.id}`;

  // Only long-cache fully-rendered comparisons. A freshly-created comparison
  // still generating its recommendation, or with image extraction in flight,
  // would otherwise be pinned in the CDN as an incomplete page for up to an
  // hour (and served stale for up to a day under stale-while-revalidate).
  const status = comparison.image_extraction_status;
  const isProcessing =
    recommendation === null || status === "pending" || status === "in_progress";
  const cacheControl = isProcessing
    ? "no-store"
    : "public, s-maxage=3600, stale-while-revalidate=86400";

  return data(
    {
      comparison,
      recommendation,
      seo: { title: seoTitle, description: seoDescription, url: seoUrl },
    },
    { headers: { "Cache-Control": cacheControl } },
  );
}

// --- per-pair meta ---

export function meta({ data: loaderData }: MetaArgs) {
  // Guard: meta runs even on 404 (loader throws); return fallback if no data.
  if (!loaderData) {
    return [{ title: SITE_TITLE }];
  }
  const { seo } = loaderData as LoaderData;
  return [
    { title: seo.title },
    { name: "description", content: seo.description },
    { tagName: "link", rel: "canonical", href: seo.url },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:url", content: seo.url },
    { property: "og:type", content: "article" },
    { property: "og:image", content: OG_IMAGE_URL },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE_URL },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
  ];
}

// --- cache headers ---

export function headers({ errorHeaders, loaderHeaders }: HeadersArgs) {
  // 404 throws carry no-store via errorHeaders; the loader sets Cache-Control on
  // success (long cache when complete, no-store while still processing).
  if (errorHeaders?.has("Cache-Control")) return errorHeaders;
  if (loaderHeaders.has("Cache-Control")) return loaderHeaders;
  return { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };
}

// --- ErrorBoundary (404 / unexpected errors) ---

export function ErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  const message = isRouteErrorResponse(error)
    ? error.data
    : (error as Error)?.message || "An unexpected error occurred";

  return (
    <div className="max-w-[860px] mx-auto px-6 py-24 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-30 mb-3">
        404 · Not Found
      </div>
      <h1 className="font-display text-[36px] tracking-[-0.5px] mb-4">
        {t("comparisonDetail.notFound.title")}
      </h1>
      <p className="text-[14px] text-ink-60 mb-8">
        {typeof message === "string" ? message : t("comparisonDetail.notFound.description")}
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

// --- Main component ---

const ComparisonDetail = () => {
  const loaderData = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  // Seed local state from loader; reseed on navigation (loaderData identity changes
  // when React Router reuses the component instance across same-route navigations).
  const [comparison, setComparison] = useState<ComparisonData>(() => loaderData.comparison);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(
    () => loaderData.recommendation,
  );

  // MANDATORY reseed — fixes A→B navigation where the lazy initializer won't re-run.
  useEffect(() => {
    setComparison(loaderData.comparison);
    setRecommendation(loaderData.recommendation);
  }, [loaderData]);

  const [activeTab, setActiveTab] = useState<Tab>("summary");
  // tv7.17: PDF print state
  const [isPrinting, setIsPrinting] = useState(false);

  const id = comparison.id;

  // dy7: fire-and-forget view counter bump — client-only, never in the loader.
  useEffect(() => {
    if (id) void supabase.rpc('increment_comparison_view', { p_comparison_id: id });
  }, [id]);

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
          .select(`id, created_at, user_id, image_extraction_status, view_count, save_count,
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

  // bead home-duo-insight-elg: the report is authored once in the author's locale
  // and reused for every viewer (never regenerated). When the viewer's current
  // locale differs from the authored language, surface a notice. NULL/unknown
  // authored language => no notice.
  const reportLanguage =
    recommendation?.language === "en" || recommendation?.language === "ja"
      ? recommendation.language
      : null;
  const viewerLanguage = (i18n.language || "en").startsWith("ja") ? "ja" : "en";
  const showLanguageNotice =
    reportLanguage !== null && reportLanguage !== viewerLanguage;

  // tv7.eod: prefer score totals, fall back to price heuristic for pre-redeploy rows
  const aScoreTotal = recommendation?.property_a_score_total ?? null;
  const bScoreTotal = recommendation?.property_b_score_total ?? null;
  let winner: "A" | "B";
  if (aScoreTotal !== null && bScoreTotal !== null) {
    winner = aScoreTotal >= bScoreTotal ? "A" : "B";
  } else {
    const aPrice = comparison.property_a.price_yen ?? 0;
    const bPrice = comparison.property_b.price_yen ?? 0;
    winner = aPrice && bPrice ? (aPrice <= bPrice ? "A" : "B") : "A";
  }

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
            totalScore:
              aScoreTotal !== null && bScoreTotal !== null
                ? Math.round(aScoreTotal)
                : winner === 'A'
                  ? 88
                  : 74,
          }}
          propertyB={{
            name: comparison.property_b.property_name || '物件 B',
            price: formatPrice(comparison.property_b.price_yen),
            totalScore:
              aScoreTotal !== null && bScoreTotal !== null
                ? Math.round(bScoreTotal)
                : winner === 'B'
                  ? 88
                  : 74,
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
          <>
            {showLanguageNotice && reportLanguage && (
              <div
                role="note"
                className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                {t("comparisonDetail.languageNotice", {
                  language: t(`comparisonDetail.languageNames.${reportLanguage}`),
                })}
              </div>
            )}
            <SummaryTab comparison={comparison} recommendation={recommendation} />
          </>
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
        propertyAAddress={comparison.property_a.address}
        viewCount={comparison.view_count}
        saveCount={comparison.save_count}
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
