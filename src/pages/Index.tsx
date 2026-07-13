import { Link, useLocation, useNavigate } from "react-router";
import type { MetaArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { SITE_URL, SITE_DESC } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import ReportCard, { type ReportCardProps } from "@/components/ui/ReportCard";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section, SectionDivider } from "@/components/ui/Section";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  analyzeProperties,
  defaultLandingPreferences,
  generateRecommendation,
} from "@/lib/comparisonFlow";
import { trackComparisonCreated, trackRecommendationGenerated } from "@/lib/analytics";
import {
  isSupportedRealEstateUrl,
  SUPPORTED_SITES,
  UNSUPPORTED_SITE_MESSAGE_JA,
} from "@/config/supported-sites";

// Each id is also the protocol value forwarded to the recommendation edge
// function as `enabled_aspects[*]`. The AI must emit exactly one
// summary_table row per enabled aspect, in the order chips appear here.
// Labels come from home.filterChips.<id> (translated per locale) — see the
// FILTER_CHIPS derivation inside the component, below.
const FILTER_CHIP_IDS = [
  "price",
  "access",
  "age",
  "layout",
  "school",
  "risk",
  "cafe",
  "gym",
  "dog",
  "quiet",
  "sunlight",
  "laundromat",
] as const;

// DISCOVER demo reports. Each entry maps directly onto <ReportCard> props
// (plus an `id` for the React key and a `to` link target).
type FeedItem = Omit<ReportCardProps, "style"> & { id: string };

const FEED_ITEMS: FeedItem[] = [
  {
    id: "demo-1",
    to: "/feed",
    num: "#0142",
    area: "渋谷区 · 目黒区",
    date: "2 日前",
    propertyA: { name: "パークコート渋谷 ザ タワー", price: "¥8,500万", score: 74 },
    propertyB: { name: "ザ・パークハウス中目黒", price: "¥9,200万", score: 88 },
    highlights: [
      { text: "B が", strong: "700万円高い" },
      { text: "B の駅距離", strong: "3分短い" },
      { text: "B の面積", strong: "+7m²" },
    ],
    expert: { name: "田中 誠一", initial: "田" },
    meta: { views: 284, saves: 12 },
  },
  {
    id: "demo-2",
    to: "/feed",
    num: "#0141",
    area: "港区",
    date: "3 日前",
    propertyA: { name: "虎ノ門ヒルズ レジデンス", price: "¥18,000万", score: 91 },
    propertyB: { name: "アークヒルズ仙石山森タワー", price: "¥15,500万", score: 79 },
    highlights: [
      { text: "A が", strong: "2,500万円高い" },
      { text: "A の面積", strong: "+12m²" },
    ],
    expert: null,
    meta: { views: 521, saves: 31 },
  },
  {
    id: "demo-3",
    to: "/feed",
    num: "#0139",
    area: "大阪市 北区",
    date: "5 日前",
    propertyA: { name: "ブランズタワー梅田 North", price: "¥6,800万", score: 71 },
    propertyB: { name: "グランドメゾン新梅田タワー", price: "¥7,200万", score: 83 },
    highlights: [
      { text: "B が", strong: "400万円高い" },
      { text: "A は", strong: "即入居可" },
    ],
    expert: { name: "山本 健太郎", initial: "山" },
    meta: { views: 198, saves: 9 },
  },
];

// --- per-route meta (no loader — static landing page) ---

export function meta(_args: MetaArgs) {
  return buildMeta({
    title: "AiSumai (愛住) — Compare Homes in Japan with AI & Experts",
    description: SITE_DESC,
    url: `${SITE_URL}/`,
  });
}

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const FILTER_CHIPS = FILTER_CHIP_IDS.map((id) => ({
    id,
    label: t(`home.filterChips.${id}`),
  }));
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set(["price"]));
  const [activeTab, setActiveTab] = useState<"url" | "id" | "area">("url");
  const [propA, setPropA] = useState("");
  const [propB, setPropB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to the compare widget when the URL hash targets it (e.g. /#compare-widget,
  // including the redirect from the deprecated /compare route).
  useEffect(() => {
    if (location.hash !== "#compare-widget") return;
    // Defer one frame so the form is mounted before we scroll.
    const id = window.requestAnimationFrame(() => {
      document
        .getElementById("compare-widget")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [location.hash, location.key]);

  const isValidUrl = (value: string) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  // A URL is acceptable for submission only if it parses as http(s) AND is on
  // the supported Japanese real estate site whitelist. Rejected URLs surface
  // a Japanese error message under the input.
  const isAcceptableUrl = (value: string) =>
    isValidUrl(value) && isSupportedRealEstateUrl(value);

  const showUnsupportedErrorA =
    activeTab === "url" && propA.trim() !== "" && isValidUrl(propA) && !isSupportedRealEstateUrl(propA);
  const showUnsupportedErrorB =
    activeTab === "url" && propB.trim() !== "" && isValidUrl(propB) && !isSupportedRealEstateUrl(propB);

  const canSubmit =
    activeTab === "url" &&
    isAcceptableUrl(propA) &&
    isAcceptableUrl(propB) &&
    activeChips.size > 0 &&
    !isSubmitting;

  const showNoChipsHint =
    activeTab === "url" && activeChips.size === 0;

  const toggleChip = (id: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const comparisonResult = await analyzeProperties(propA.trim(), propB.trim(), user?.id);
      trackComparisonCreated(comparisonResult.comparison_id);

      // If the edge function returned an existing comparison for the same
      // URL pair within today's UTC bucket, surface a toast so the user
      // understands they're seeing a reused report rather than a fresh
      // analysis. See bead home-duo-insight-mc4.
      if (comparisonResult.cached) {
        toast({
          title: t("compare.messages.cached_title"),
          description: t("compare.messages.cached_description"),
        });
      }

      const enabledAspects = FILTER_CHIPS
        .map((chip) => chip.id)
        .filter((id) => activeChips.has(id));
      const recommendation = await generateRecommendation(
        comparisonResult,
        defaultLandingPreferences,
        user?.id,
        enabledAspects,
      );
      trackRecommendationGenerated(
        comparisonResult.comparison_id,
        recommendation.recommendation_id,
      );

      navigate(`/comparisons/${comparisonResult.comparison_id}`);
    } catch (error) {
      console.error("Failed to create comparison from landing page:", error);
      toast({
        variant: "destructive",
        title: t("compare.messages.error_title"),
        description:
          error instanceof Error
            ? error.message
            : t("compare.messages.error_unexpected"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 bg-paper">
        <div className="w-full max-w-[860px] mx-auto">
          <Eyebrow rules className="mb-5">
            {t("home.hero.eyebrow")}
          </Eyebrow>

          <h1 className="font-display text-[clamp(40px,6vw,72px)] leading-[1.1] tracking-[-1px] text-ink mb-3">
            {t("home.hero.titleLine1")}<br />
            <em className="italic text-ink-60">{t("home.hero.titleLine2")}</em>
          </h1>
          <p className="text-[15px] text-ink-60 mb-12 font-light">
            {t("home.hero.subtitle")}
          </p>

          {/* COMPARE WIDGET */}
          <form
            id="compare-widget"
            onSubmit={handleCompare}
            className="compare-widget mx-auto text-left scroll-mt-[72px]"
          >
            <div className="flex border-b border-rule bg-paper-dark px-5 gap-0.5">
              {([
                { id: "url", label: t("home.widget.tabUrl") },
                { id: "id", label: t("home.widget.tabId") },
                { id: "area", label: t("home.widget.tabArea") },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-mono text-[11px] uppercase tracking-[0.06em] px-3.5 py-2.5 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-ink text-ink"
                      : "border-transparent text-ink-60 hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 pl-0.5">
                  {t("home.widget.propertyALabel")}
                </label>
                <input
                  type="text"
                  value={propA}
                  onChange={(e) => setPropA(e.target.value)}
                  placeholder={t("home.widget.propertyAPlaceholder")}
                  disabled={isSubmitting || activeTab !== "url"}
                  aria-invalid={showUnsupportedErrorA || undefined}
                  aria-describedby={showUnsupportedErrorA ? "compare-error-a" : undefined}
                  className={`w-full px-4 py-3 text-[16px] md:text-[14px] bg-paper border rounded-md text-ink outline-none transition-colors focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] placeholder:text-ink-30 ${
                    showUnsupportedErrorA
                      ? "border-red-500 focus:border-red-500"
                      : "border-rule focus:border-ink"
                  }`}
                />
                {showUnsupportedErrorA && (
                  <p id="compare-error-a" className="text-[11px] text-red-600 leading-snug pl-0.5">
                    {UNSUPPORTED_SITE_MESSAGE_JA}
                  </p>
                )}
              </div>
              <div className="hidden md:flex w-9 h-9 items-center justify-center border border-rule rounded-full font-mono text-[11px] text-ink-60 bg-paper-dark mb-1">
                {t("home.widget.vsLabel")}
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 pl-0.5">
                  {t("home.widget.propertyBLabel")}
                </label>
                <input
                  type="text"
                  value={propB}
                  onChange={(e) => setPropB(e.target.value)}
                  placeholder={t("home.widget.propertyBPlaceholder")}
                  disabled={isSubmitting || activeTab !== "url"}
                  aria-invalid={showUnsupportedErrorB || undefined}
                  aria-describedby={showUnsupportedErrorB ? "compare-error-b" : undefined}
                  className={`w-full px-4 py-3 text-[16px] md:text-[14px] bg-paper border rounded-md text-ink outline-none transition-colors focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] placeholder:text-ink-30 ${
                    showUnsupportedErrorB
                      ? "border-red-500 focus:border-red-500"
                      : "border-rule focus:border-ink"
                  }`}
                />
                {showUnsupportedErrorB && (
                  <p id="compare-error-b" className="text-[11px] text-red-600 leading-snug pl-0.5">
                    {UNSUPPORTED_SITE_MESSAGE_JA}
                  </p>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {FILTER_CHIPS.map((chip) => {
                  const active = activeChips.has(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip.id)}
                      aria-pressed={active}
                      className={`font-mono text-[10px] uppercase tracking-[0.06em] border rounded-full px-2.5 py-1 transition-colors ${
                        active
                          ? "bg-ink text-paper border-ink"
                          : "bg-paper-dark text-ink-60 border-rule hover:bg-ink hover:text-paper hover:border-ink"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                <Button type="submit" disabled={!canSubmit} variant="editorial" size="editorial">
                  <ArrowRight className="w-3.5 h-3.5" />
                  {isSubmitting ? t("home.widget.submitting") : t("home.widget.submit")}
                </Button>
                {showNoChipsHint && (
                  <p className="text-[11px] text-ink-60 leading-snug pl-0.5 sm:text-right">
                    {t("home.widget.noChipsHint")}
                  </p>
                )}
              </div>
            </div>

            <div className="px-5 pt-2.5 pb-4 flex flex-wrap gap-4 justify-center border-t border-rule">
              <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                <span className="w-1 h-1 rounded-full bg-ink/30" />
                {SUPPORTED_SITES.map((site) => site.label).join(" / ")} {t("home.widget.supportedSitesSuffix")}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                <span className="w-1 h-1 rounded-full bg-ink/30" />
                {t("home.widget.freeTier")}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                <span className="w-1 h-1 rounded-full bg-ink/30" />
                {t("home.widget.doubleCheck")}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider label={t("home.discover.dividerLabel")} />

      {/* FEED PREVIEW */}
      <Section className="mt-10 pb-24">
        <div className="flex items-center justify-between mb-5">
          <Eyebrow>{t("home.discover.eyebrow")}</Eyebrow>
          <Link
            to="/feed"
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 hover:text-ink no-underline border border-transparent hover:border-rule rounded-full px-2.5 py-1"
          >
            {t("home.discover.viewAll")}
          </Link>
        </div>

        <div className="flex flex-col gap-px bg-rule border border-rule rounded-lg overflow-hidden">
          {FEED_ITEMS.map(({ id, ...cardProps }) => (
            <ReportCard key={id} {...cardProps} />
          ))}
        </div>
      </Section>
    </>
  );
};

export default Index;
