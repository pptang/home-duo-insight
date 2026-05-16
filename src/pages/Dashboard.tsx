import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, dateAgo } from "@/lib/format";
import {
  analyzeProperties,
  generateRecommendation,
  defaultLandingPreferences,
} from "@/lib/comparisonFlow";
import ReportCard, { type ReportCardHighlight } from "@/components/ui/ReportCard";
import StatusReportCard from "@/components/StatusReportCard";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

interface Property {
  id: string;
  property_name: string | null;
  price_yen: number | null;
  floor_plan: string | null;
  image_urls: string[] | null;
  property_type: string | null;
}

interface DashboardComparison {
  id: string;
  created_at: string | null;
  user_id: string | null;
  status: "processing" | "failed" | "published" | "archived";
  failure_reason: string | null;
  property_url_a: string | null;
  property_url_b: string | null;
  propertyA: Property;
  propertyB: Property;
}

/** Loading skeleton shared by the auth-resolving and data-fetching states. */
const DashboardSkeleton = () => (
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
);

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [comparisons, setComparisons] = useState<DashboardComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Track which comparison is being retried — null means none is retrying
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // All hooks must run unconditionally — the auth gate redirect is rendered
  // below, not via an early return before hooks.
  useEffect(() => {
    if (!user) return;

    const fetchComparisons = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("comparisons")
          .select(`
            *,
            propertyA:property_a_id(id, property_name, price_yen, floor_plan, image_urls, property_type),
            propertyB:property_b_id(id, property_name, price_yen, floor_plan, image_urls, property_type)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError(t("feed.error.retry"));
          return;
        }

        if (!data || data.length === 0) {
          setComparisons([]);
          return;
        }

        // Filter out archived rows client-side
        const transformed: DashboardComparison[] = data
          .filter((c) => c.status !== "archived")
          .map((c) => {
            if (
              !c.propertyA ||
              !c.propertyB ||
              typeof c.propertyA === "string" ||
              typeof c.propertyB === "string"
            ) {
              return null;
            }
            return {
              id: c.id,
              created_at: c.created_at,
              user_id: c.user_id,
              status: c.status as DashboardComparison["status"],
              failure_reason: c.failure_reason,
              property_url_a: c.property_url_a,
              property_url_b: c.property_url_b,
              propertyA: c.propertyA as Property,
              propertyB: c.propertyB as Property,
            };
          })
          .filter(Boolean) as DashboardComparison[];

        setComparisons(transformed);
      } catch {
        setError(t("feed.error.retry"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisons();
  }, [user, refreshTrigger, t]);

  /**
   * Re-trigger analysis for a failed comparison.
   *
   * NOTE: retry uses defaultLandingPreferences because the failed comparison
   * does not persist the original PersonalizationValues the user provided —
   * they are not stored in the database, only used in-memory during the
   * original flow. This is an accepted limitation.
   */
  const handleRetry = async (c: DashboardComparison) => {
    if (!c.property_url_a || !c.property_url_b) return;

    setRetryingId(c.id);
    try {
      const result = await analyzeProperties(c.property_url_a, c.property_url_b, user!.id);
      await generateRecommendation(result, defaultLandingPreferences, user!.id);

      // Archive the old failed row so it leaves the dashboard
      const { error: archiveErr } = await supabase
        .from("comparisons")
        .update({ status: "archived" })
        .eq("id", c.id);
      if (archiveErr) {
        console.error("Failed to archive old comparison:", archiveErr);
      }

      navigate(`/comparisons/${result.comparison_id}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("compare.messages.error_title"),
        description:
          err instanceof Error ? err.message : t("compare.messages.error_unexpected"),
      });
    } finally {
      setRetryingId(null);
    }
  };

  // Auth gate: redirect unauthenticated users after hooks have all been called
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // While auth is resolving show a loading skeleton
  if (authLoading) {
    return (
      <div className="bg-paper text-ink">
        <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper text-ink">
      <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <div className="sticky top-[52px] -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 bg-paper/95 backdrop-blur-md border-b border-rule mb-6 flex flex-wrap items-center justify-between gap-3 z-10">
          <div>
            <h1 className="font-display text-[22px] tracking-[-0.3px]">
              {t("dashboard.title")}
            </h1>
            <p className="text-[12px] text-ink-60 mt-0.5">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="editorial"
              size="editorial-sm"
              onClick={() => setRefreshTrigger((p) => p + 1)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              {t("dashboard.refresh")}
            </Button>
            <Button asChild variant="editorial" size="editorial-sm">
              <Link to="/compare">
                <Plus className="w-3 h-3" />
                {t("dashboard.empty.button")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && <DashboardSkeleton />}

        {/* Error */}
        {error && !isLoading && (
          <div className="border border-rule rounded-lg p-4 bg-paper-dark flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-ink-60" />
            <span className="text-[13px] text-ink-60">{error}</span>
            <button
              onClick={() => setRefreshTrigger((p) => p + 1)}
              className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink underline"
            >
              {t("dashboard.refresh")}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && comparisons.length === 0 && (
          <SurfaceCard pad="none" className="p-12 text-center">
            <Eyebrow size="sm" tone="muted" className="mb-3">
              Empty
            </Eyebrow>
            <h3 className="font-display text-[20px] tracking-[-0.3px] mb-2">
              {t("dashboard.empty.title")}
            </h3>
            <p className="text-[13px] text-ink-60 mb-5">
              {t("dashboard.empty.subtitle")}
            </p>
            <Button asChild variant="editorial" className="text-[13px]">
              <Link to="/compare">
                <Plus className="w-4 h-4" />
                {t("dashboard.empty.button")}
              </Link>
            </Button>
          </SurfaceCard>
        )}

        {/* Report list */}
        {!isLoading && !error && comparisons.length > 0 && (
          <div className="flex flex-col gap-3">
            {comparisons.map((c, idx) => {
              const num = `#${(idx + 1).toString().padStart(4, "0")}`;
              const date = c.created_at ? dateAgo(c.created_at) : "—";

              if (c.status === "published") {
                const aPrice = c.propertyA.price_yen ?? 0;
                const bPrice = c.propertyB.price_yen ?? 0;
                const winner: "A" | "B" | null =
                  aPrice && bPrice ? (aPrice < bPrice ? "A" : "B") : null;

                const highlights: ReportCardHighlight[] = [];
                if (c.propertyA.property_type) {
                  highlights.push({ text: c.propertyA.property_type, strong: "" });
                }

                return (
                  <ReportCard
                    key={c.id}
                    to={`/comparisons/${c.id}`}
                    num={num}
                    area={c.propertyA.floor_plan || "—"}
                    date={date}
                    propertyA={{
                      name: c.propertyA.property_name || "物件 A",
                      price: formatPrice(c.propertyA.price_yen),
                      score: winner === "A" ? 88 : 74,
                    }}
                    propertyB={{
                      name: c.propertyB.property_name || "物件 B",
                      price: formatPrice(c.propertyB.price_yen),
                      score: winner === "B" ? 88 : 74,
                    }}
                    highlights={highlights}
                    expert={null}
                    style={{ animation: `fade-in-up 0.4s ease ${idx * 0.06}s both` }}
                  />
                );
              }

              if (c.status === "processing") {
                return (
                  <StatusReportCard
                    key={c.id}
                    comparisonId={c.id}
                    num={num}
                    date={date}
                    variant="processing"
                  />
                );
              }

              // status === "failed"
              return (
                <StatusReportCard
                  key={c.id}
                  comparisonId={c.id}
                  num={num}
                  date={date}
                  variant="failed"
                  failureReason={c.failure_reason}
                  urlA={c.property_url_a}
                  urlB={c.property_url_b}
                  onRetry={() => handleRetry(c)}
                  isRetrying={retryingId === c.id}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
