import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  analyzeProperties,
  defaultLandingPreferences,
  generateRecommendation,
} from "@/lib/comparisonFlow";
import { trackComparisonCreated, trackRecommendationGenerated } from "@/lib/analytics";

const FILTER_CHIPS = [
  { id: "price", label: "価格" },
  { id: "access", label: "交通" },
  { id: "age", label: "築年数" },
  { id: "layout", label: "間取り" },
  { id: "school", label: "学区" },
  { id: "risk", label: "リスク" },
];

const FEED_ITEMS = [
  {
    id: "demo-1",
    num: "#0142",
    area: "渋谷区 · 目黒区",
    date: "2日前",
    propA: { name: "パークコート渋谷 ザ タワー", price: "¥8,500万", score: 74, win: false },
    propB: { name: "ザ・パークハウス中目黒", price: "¥9,200万", score: 88, win: true },
    highlights: [
      { text: "B が", strong: "700万円高い" },
      { text: "B の駅距離", strong: "3分短い" },
      { text: "B の面積", strong: "+7m²" },
    ],
    expert: { name: "田中 誠一", initial: "田", claimed: true },
    stats: { views: 284, saves: 12 },
  },
  {
    id: "demo-2",
    num: "#0141",
    area: "港区",
    date: "3日前",
    propA: { name: "虎ノ門ヒルズ レジデンス", price: "¥18,000万", score: 91, win: true },
    propB: { name: "アークヒルズ仙石山森タワー", price: "¥15,500万", score: 79, win: false },
    highlights: [
      { text: "A が", strong: "2,500万円高い" },
      { text: "A の面積", strong: "+12m²" },
    ],
    expert: { claimed: false },
    stats: { views: 521, saves: 31 },
  },
  {
    id: "demo-3",
    num: "#0139",
    area: "大阪市 北区",
    date: "5日前",
    propA: { name: "ブランズタワー梅田 North", price: "¥6,800万", score: 71, win: false },
    propB: { name: "グランドメゾン新梅田タワー", price: "¥7,200万", score: 83, win: true },
    highlights: [
      { text: "B が", strong: "400万円高い" },
      { text: "A は", strong: "即入居可" },
    ],
    expert: { name: "山本 健太郎", initial: "山", claimed: true },
    stats: { views: 198, saves: 9 },
  },
];

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set(["price"]));
  const [activeTab, setActiveTab] = useState<"url" | "id" | "area">("url");
  const [propA, setPropA] = useState("");
  const [propB, setPropB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidUrl = (value: string) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const canSubmit =
    activeTab === "url" &&
    isValidUrl(propA) &&
    isValidUrl(propB) &&
    !isSubmitting;

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

      const recommendation = await generateRecommendation(
        comparisonResult,
        defaultLandingPreferences,
        user?.id,
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
      <section className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(10,10,10,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-[860px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-60 mb-5 flex items-center justify-center gap-2.5">
            <span className="block w-7 h-px bg-ink/30" />
            日本の不動産を、正直に比べる
            <span className="block w-7 h-px bg-ink/30" />
          </div>

          <h1 className="font-display text-[clamp(40px,6vw,72px)] leading-[1.1] tracking-[-1px] text-ink mb-3">
            Compare homes,<br />
            <em className="italic text-ink-60">not brochures.</em>
          </h1>
          <p className="text-[15px] text-ink-60 mb-12 font-light">
            2つの物件を入力するだけ。AIが数秒でフェアな比較レポートを作成します。
          </p>

          {/* COMPARE WIDGET */}
          <form onSubmit={handleCompare} className="compare-widget mx-auto text-left">
            <div className="flex border-b border-rule bg-paper-dark px-5 gap-0.5">
              {([
                { id: "url", label: "物件URL" },
                { id: "id", label: "物件番号" },
                { id: "area", label: "エリア名で検索" },
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
                  物件 A
                </label>
                <input
                  type="text"
                  value={propA}
                  onChange={(e) => setPropA(e.target.value)}
                  placeholder="例：SUUMO の URL または 物件名"
                  disabled={isSubmitting || activeTab !== "url"}
                  className="w-full px-4 py-3 text-[14px] bg-paper border border-rule rounded-md text-ink outline-none transition-colors focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] placeholder:text-ink-30"
                />
              </div>
              <div className="hidden md:flex w-9 h-9 items-center justify-center border border-rule rounded-full font-mono text-[11px] text-ink-60 bg-paper-dark mb-1">
                vs
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-60 pl-0.5">
                  物件 B
                </label>
                <input
                  type="text"
                  value={propB}
                  onChange={(e) => setPropB(e.target.value)}
                  placeholder="例：HOME'S の URL または 物件名"
                  disabled={isSubmitting || activeTab !== "url"}
                  className="w-full px-4 py-3 text-[14px] bg-paper border border-rule rounded-md text-ink outline-none transition-colors focus:border-ink focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] placeholder:text-ink-30"
                />
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
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-ink text-paper px-6 py-2.5 rounded-md text-[13px] font-medium tracking-[0.01em] flex items-center justify-center gap-2 hover:opacity-85 transition-all hover:-translate-y-0.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {isSubmitting ? "比較を作成中..." : "比較する"}
              </button>
            </div>

            <div className="px-5 pt-2.5 pb-4 flex flex-wrap gap-4 justify-center border-t border-rule">
              <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                <span className="w-1 h-1 rounded-full bg-ink/30" />
                SUUMO / HOME'S / LIFULL 対応
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                <span className="w-1 h-1 rounded-full bg-ink/30" />
                無料で3比較/月
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-60">
                <span className="w-1 h-1 rounded-full bg-ink/30" />
                AI + 専門家のダブルチェック
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-[860px] mx-auto px-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-rule" />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-30 whitespace-nowrap">
          Discover — 最新比較レポート
        </span>
        <div className="flex-1 h-px bg-rule" />
      </div>

      {/* FEED PREVIEW */}
      <section className="max-w-[860px] mx-auto mt-10 px-6 pb-24">
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-60">
            新着比較レポート
          </span>
          <Link
            to="/feed"
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-60 hover:text-ink no-underline border border-transparent hover:border-rule rounded-full px-2.5 py-1"
          >
            すべて見る →
          </Link>
        </div>

        <div className="flex flex-col gap-px bg-rule border border-rule rounded-lg overflow-hidden">
          {FEED_ITEMS.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </>
  );
};

const ReportCard = ({ item }: { item: typeof FEED_ITEMS[number] }) => {
  return (
    <Link
      to="/feed"
      className="rcard no-underline text-ink"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] min-h-[120px]">
        <div className="p-4 flex flex-col justify-between border-r border-rule">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">
                {item.num}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-60 bg-paper-dark px-1.5 py-0.5 rounded-sm">
                {item.area}
              </span>
              <span className="font-mono text-[9px] text-ink-30 ml-auto">{item.date}</span>
            </div>
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] leading-[1.25] tracking-[-0.2px] truncate">
                  {item.propA.name}
                </div>
                <div className="font-display text-[14px] tracking-[-0.3px] mt-0.5">
                  {item.propA.price}
                </div>
              </div>
              <div className="flex-shrink-0 w-[22px] h-[22px] border border-rule rounded-full flex items-center justify-center font-mono text-[8px] text-ink-30 mt-0.5">
                vs
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[13px] leading-[1.25] tracking-[-0.2px] truncate">
                  {item.propB.name}
                </div>
                <div className="font-display text-[14px] tracking-[-0.3px] mt-0.5">
                  {item.propB.price}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.highlights.map((h, i) => (
              <span key={i} className="text-[11px] text-ink-60 bg-paper-dark px-1.5 py-0.5 rounded-sm">
                {h.text}<strong className="text-ink font-medium">{h.strong}</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="grid grid-cols-2 flex-1">
            <div className={`p-2.5 flex flex-col justify-between border-b border-rule ${item.propA.win ? "bg-ink" : "bg-paper-dark"}`}>
              <div className={`font-mono text-[8px] uppercase tracking-[0.1em] mb-0.5 ${item.propA.win ? "text-paper/40" : "text-ink-30"}`}>
                物件 A
              </div>
              <div className={`font-display text-[26px] leading-none tracking-[-1px] ${item.propA.win ? "text-paper" : "text-ink-30"}`}>
                {item.propA.score}
              </div>
              <div className={`font-mono text-[8px] ${item.propA.win ? "text-paper/30" : "text-ink-30"}`}>/ 100</div>
              {item.propA.win && (
                <span className="font-mono text-[7px] uppercase tracking-[0.1em] border border-paper/25 text-paper/70 px-1.5 py-0.5 rounded-sm w-fit mt-1">
                  AI 推奨
                </span>
              )}
            </div>
            <div className={`p-2.5 flex flex-col justify-between border-b border-rule ${item.propB.win ? "bg-ink" : "bg-paper-dark"}`}>
              <div className={`font-mono text-[8px] uppercase tracking-[0.1em] mb-0.5 ${item.propB.win ? "text-paper/40" : "text-ink-30"}`}>
                物件 B
              </div>
              <div className={`font-display text-[26px] leading-none tracking-[-1px] ${item.propB.win ? "text-paper" : "text-ink-30"}`}>
                {item.propB.score}
              </div>
              <div className={`font-mono text-[8px] ${item.propB.win ? "text-paper/30" : "text-ink-30"}`}>/ 100</div>
              {item.propB.win && (
                <span className="font-mono text-[7px] uppercase tracking-[0.1em] border border-paper/25 text-paper/70 px-1.5 py-0.5 rounded-sm w-fit mt-1">
                  AI 推奨
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            {item.expert.claimed ? (
              <>
                <div className="w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center font-mono text-[8px]">
                  {item.expert.initial}
                </div>
                <span className="text-[11px] font-medium flex-1 truncate">{item.expert.name}</span>
                <span className="font-mono text-[7px] uppercase tracking-[0.08em] border border-rule text-ink-60 px-1.5 py-0.5 rounded-sm">
                  コメントあり
                </span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-paper-dark border border-rule text-ink-30 flex items-center justify-center font-mono text-[8px]">
                  ?
                </div>
                <span className="font-mono text-[8px] uppercase tracking-[0.06em] text-ink-30 flex-1">
                  専門家コメント待ち
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 px-4 py-1.5 bg-paper-dark border-t border-rule">
        <span className="font-mono text-[9px] uppercase text-ink-30">👁 {item.stats.views}</span>
        <span className="font-mono text-[9px] uppercase text-ink-30">🔖 {item.stats.saves}</span>
      </div>
    </Link>
  );
};

export default Index;
