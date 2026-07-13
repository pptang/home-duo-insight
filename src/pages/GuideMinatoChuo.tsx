import { Link } from "react-router";
import type { MetaArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowUp, TriangleAlert, ArrowRight, ArrowLeft } from "lucide-react";
import { SITE_URL, OG_IMAGE_URL } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { MinatoChuoKeyVisual } from "@/components/guides/MinatoChuoKeyVisual";
import { EN_CONTENT, ZH_CONTENT, type ScoreCell as ScoreCellData } from "@/content/guides/minatoVsChuo";

// Static editorial content page — second entry in the /guides series.
// No loader — the article body is fixed research content, not DB-backed.
// Bilingual: en/ja both render EN_CONTENT (this guide has no separate
// Japanese translation, matching fukuoka-vs-osaka); zh-TW renders an
// independently-authored ZH_CONTENT rather than a literal translation,
// since the source article is explicitly written for HK/TW cash buyers.

export function meta(_args: MetaArgs) {
  const title = "港区 vs 中央区 — 2026年投資分析 | AiSumai 愛住";
  const description =
    "同じ東京、まったく違う暮らし。港区と中央区、海外の現金買主が比較すべきなのは2つの区ではなく3つのシナリオ。日本橋の再開発と定期借地権のリスクを分析。";
  const ogTitle = "港区 vs 中央区 — Same city, two completely different lives";
  const ogDescription =
    "Both wards draw the same HK and TW buyers. The numbers are closer than you'd expect — what isn't close is the daily experience of living there.";
  const url = `${SITE_URL}/guides/minato-vs-chuo`;

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:url", content: url },
    { property: "og:type", content: "article" },
    { property: "og:image", content: OG_IMAGE_URL },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE_URL },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
  ];
}

const SOURCES = [
  {
    n: 1,
    title: "東京23区マンション価格上昇率ランキング — 9年前と比較",
    org: "マンションリサーチ株式会社 / マンションナビ · April 2025",
    href: "https://prtimes.jp/main/html/rd/p/000000098.000013438.html",
    label: "prtimes.jp",
  },
  {
    n: 2,
    title: "中央区マンション価格相場推移 2026年4月",
    org: "マンションナビ · April 2026",
    href: "https://t23m-navi.jp/list/東京都中央区",
    label: "t23m-navi.jp",
  },
  {
    n: 3,
    title: "FAMIMA PARK AZABUDAI — 次世代コンビニ旗艦店レポート",
    org: "FASHIONSNAP / GQ Japan · July 2026",
    href: "https://www.fashionsnap.com/article/2026-07-09/famima-park-azabudai-preview/",
    label: "fashionsnap.com",
  },
  {
    n: 4,
    title: "東京ミッドタウン日本橋 街区名称決定 · 日本橋リバーウォーク始動",
    org: "三井不動産株式会社 · April 2026",
    href: "https://www.mitsuifudosan.co.jp/corporate/news/2026/0421/",
    label: "mitsuifudosan.co.jp",
  },
  {
    n: 5,
    title: "2026年版 港区タワマン相場 · 独自データ分析",
    org: "Dr. Asset Blog · February 2026",
    href: "https://www.dr-asset.jp/blog/2026年版【港区タワマン相場】",
    label: "dr-asset.jp",
  },
] as const;

function ScoreCell({ tone, children }: { tone: ScoreCellData["tone"]; children: React.ReactNode }) {
  const toneClass =
    tone === "good"
      ? "text-risk-low font-semibold"
      : tone === "mid"
        ? "text-risk-med font-semibold"
        : "text-risk-high font-semibold";
  return <div className={`p-3 text-[12px] leading-[1.4] ${toneClass}`}>{children}</div>;
}

function CityHeader({
  jp,
  en,
  tag,
  tagClassName,
}: {
  jp: string;
  en: string;
  tag: string;
  tagClassName: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <div className="font-['Noto_Serif_JP',serif] text-[42px] font-black leading-none tracking-[-1px]">
          {jp}
        </div>
        <span className="text-[11px] font-bold tracking-[4px] text-ink-60 block mt-1.5">{en}</span>
      </div>
      <span
        className={`text-[12px] font-bold tracking-[0.3px] px-4 py-1.5 rounded-full whitespace-nowrap mt-1.5 ${tagClassName}`}
      >
        {tag}
      </span>
    </div>
  );
}

const GuideMinatoChuo = () => {
  const { i18n } = useTranslation();
  const copy = i18n.language === "zh-TW" ? ZH_CONTENT : EN_CONTENT;

  return (
    <>
      <Section width="narrow" className="pt-6">
        <Link
          to="/guides"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-60 no-underline hover:text-ink mb-4"
        >
          <ArrowLeft className="w-3 h-3" aria-hidden="true" />
          All Guides
        </Link>

        {/* KEY VISUAL */}
        <MinatoChuoKeyVisual className="block rounded-xl mt-2" />

        {/* ARTICLE HEADER */}
        <header className="pt-9 pb-8 border-b border-rule">
          <Eyebrow size="sm" tone="muted" className="mb-4">
            {copy.eyebrow}
          </Eyebrow>
          <h1 className="font-display text-[clamp(28px,4.5vw,42px)] font-black leading-[1.1] tracking-[-1px] text-ink mb-4">
            {copy.titleLine1}
            <br />
            <em className="italic font-normal">{copy.titleEmphasis}</em>
          </h1>
          <p className="text-[17px] text-ink-60 font-light leading-[1.65] border-l-[3px] border-ink pl-4">
            {copy.deck}
          </p>
          <div className="text-[11px] text-ink-30 mt-5">{copy.metaLine}</div>
        </header>

        {/* SECTION 1 */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            {copy.section1.heading}
          </h2>
          <p className="text-ink-80 leading-[1.82] mb-4">{copy.section1.p1}</p>
          <p className="text-ink-80 leading-[1.82]">{copy.section1.p2}</p>

          <SurfaceCard tone="ink" pad="lg" className="my-8 !p-7 sm:!p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-3">
              {copy.section1.thesisLabel}
            </div>
            <div className="font-display italic text-[clamp(17px,2.6vw,21px)] leading-[1.55] text-paper">
              {copy.section1.thesisText}
            </div>
          </SurfaceCard>
        </div>

        {/* SECTION 2: MINATO */}
        <div className="py-11 border-b border-rule">
          <CityHeader
            jp="港区"
            en="MINATO-KU"
            tag={copy.minato.tag}
            tagClassName="bg-[#EAF0F7] text-[#1A3A5C]"
          />

          <p className="text-ink-80 leading-[1.82] mb-4">{copy.minato.p1}</p>
          <p className="text-ink-80 leading-[1.82]">{copy.minato.p2}</p>

          <div className="border-t-[3px] border-ink pt-6 pb-5 my-8">
            <div className="font-display text-[clamp(52px,9vw,80px)] font-black leading-[0.9] tracking-[-3px]">
              {copy.minato.pullStatNum}
            </div>
            <div className="text-[14px] font-medium mt-2.5 max-w-[520px] leading-[1.55]">
              {copy.minato.pullStatInsight}
            </div>
            <div className="text-[11px] text-ink-30 mt-1.5">{copy.minato.pullStatNote}</div>
          </div>

          <p className="text-ink-80 leading-[1.82] mb-6">{copy.minato.p3}</p>

          {/* LIFESTYLE SPLIT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            <div className="rounded-[10px] p-5 bg-[#EAF0F7]">
              <div className="text-[10px] font-bold tracking-[2px] uppercase mb-2.5 text-[#1A3A5C]">
                {copy.lifestyleSplit.minatoLabel}
              </div>
              <div className="text-[13px] leading-[1.65] text-ink">{copy.lifestyleSplit.minatoText}</div>
            </div>
            <div className="rounded-[10px] p-5 bg-[#F5F0E8]">
              <div className="text-[10px] font-bold tracking-[2px] uppercase mb-2.5 text-[#4A3000]">
                {copy.lifestyleSplit.chuoLabel}
              </div>
              <div className="text-[13px] leading-[1.65] text-ink">{copy.lifestyleSplit.chuoText}</div>
            </div>
          </div>

          <div className="border border-rule rounded-[10px] p-5 grid grid-cols-[auto_1fr] gap-3.5 items-start">
            <div className="w-8 h-8 rounded-full bg-paper-dark border border-rule flex items-center justify-center flex-shrink-0 mt-px">
              <ArrowUp className="w-4 h-4 text-ink" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-[13px] mb-1">{copy.minato.insightTitle}</div>
              <div className="text-[13px] text-ink-60 leading-[1.6]">{copy.minato.insightBody}</div>
            </div>
          </div>
        </div>

        {/* SECTION 3: CHUO */}
        <div className="py-11 border-b border-rule">
          <CityHeader
            jp="中央区"
            en="CHUO-KU"
            tag={copy.chuo.tag}
            tagClassName="bg-[#1A3A5C] text-white"
          />

          <p className="text-ink-80 leading-[1.82] mb-6">{copy.chuo.p1}</p>

          {/* CONVERGENCE */}
          <div className="bg-paper-dark rounded-xl p-6 my-7">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-60 mb-4">
              {copy.chuo.convergenceLabel}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {copy.chuo.convergenceItems.map((item) => (
                <div key={item.year} className="bg-paper border border-rule rounded-[10px] p-3.5">
                  <div className="font-display text-[22px] font-bold tracking-[-0.5px] leading-none">
                    {item.year}
                  </div>
                  <div className="text-[12px] font-semibold mt-1.5">{item.name}</div>
                  <div className="text-[11px] text-ink-60 mt-0.5 leading-[1.4]">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="text-[12px] text-ink-60 mt-3 italic">{copy.chuo.convergenceNote}</div>
          </div>

          <p className="text-ink-80 leading-[1.82] mb-4">{copy.chuo.p2}</p>
          <p className="text-ink-80 leading-[1.82] mb-6">{copy.chuo.p3}</p>

          <div className="border-t-[3px] border-ink pt-6 pb-5 my-8">
            <div className="font-display text-[clamp(52px,9vw,80px)] font-black leading-[0.9] tracking-[-3px]">
              {copy.chuo.pullStatNum}
            </div>
            <div className="text-[14px] font-medium mt-2.5 max-w-[520px] leading-[1.55]">
              {copy.chuo.pullStatInsight}
            </div>
            <div className="text-[11px] text-ink-30 mt-1.5">{copy.chuo.pullStatNote}</div>
          </div>

          <div className="border border-rule rounded-[10px] p-5 grid grid-cols-[auto_1fr] gap-3.5 items-start">
            <div className="w-8 h-8 rounded-full bg-paper-dark border border-rule flex items-center justify-center flex-shrink-0 mt-px">
              <TriangleAlert className="w-4 h-4 text-ink" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-[13px] mb-2">{copy.chuo.insightTitle}</div>
              <div className="flex flex-col gap-2">
                {copy.chuo.insightItems.map((item) => (
                  <div key={item.label} className="text-[13px] text-ink-60 leading-[1.6]">
                    <strong className="text-ink font-semibold">{item.label}: </strong>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            {copy.section4.heading}
          </h2>
          <p className="text-ink-80 leading-[1.82] mb-4">{copy.section4.p1}</p>
          <p className="text-ink-80 leading-[1.82] mb-4">{copy.section4.p2}</p>
          <p className="text-ink-80 leading-[1.82]">{copy.section4.p3}</p>
        </div>

        {/* SECTION 5 */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            {copy.section5.heading}
          </h2>
          <p className="text-ink-80 leading-[1.82] mb-4">{copy.section5.p1}</p>
          <p className="text-ink-80 leading-[1.82]">{copy.section5.p2}</p>
        </div>

        {/* SCORECARD */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            {copy.scorecard.heading}
          </h2>
          <p className="text-[13px] text-ink-60 mb-5">{copy.scorecard.subtitle}</p>

          <div className="border border-rule rounded-xl overflow-hidden overflow-x-auto">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-3 bg-ink text-paper">
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3] bg-white/[0.06]">
                  Factor
                </div>
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3]">
                  {copy.scorecard.minatoColLabel}
                </div>
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3]">
                  {copy.scorecard.chuoColLabel}
                </div>
              </div>

              {copy.scorecard.rows.map((row) => (
                <div key={row.factor} className="grid grid-cols-3 border-t border-rule">
                  <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                    {row.factor}
                  </div>
                  <ScoreCell tone={row.minato.tone}>{row.minato.text}</ScoreCell>
                  <ScoreCell tone={row.chuo.tone}>{row.chuo.text}</ScoreCell>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OUR READ */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            {copy.ourRead.heading}
          </h2>
          <SurfaceCard tone="ink" pad="lg" className="!p-7 sm:!p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper/45 mb-5 font-bold">
              {copy.ourRead.label}
            </div>
            <div className="flex gap-4 mb-4 pb-4 border-b border-white/10">
              <div className="font-['Noto_Serif_JP',serif] text-[22px] font-black leading-none flex-shrink-0 min-w-[68px] text-paper">
                {copy.ourRead.minatoWard}
              </div>
              <div className="text-[14px] text-paper/[0.88] leading-[1.75]">{copy.ourRead.minatoText}</div>
            </div>
            <div className="flex gap-4">
              <div className="font-['Noto_Serif_JP',serif] text-[22px] font-black leading-none flex-shrink-0 min-w-[68px] text-paper">
                {copy.ourRead.chuoWard}
              </div>
              <div className="text-[14px] text-paper/[0.88] leading-[1.75]">{copy.ourRead.chuoText}</div>
            </div>
          </SurfaceCard>
        </div>

        {/* CTA */}
        <div className="py-11 border-b border-rule">
          <SurfaceCard tone="paper-dark" pad="lg" className="text-center">
            <h3 className="font-display text-[21px] mb-2">{copy.cta.heading}</h3>
            <p className="text-[13px] text-ink-60 mb-5 max-w-[360px] mx-auto">{copy.cta.body}</p>
            <Button asChild variant="editorial" size="editorial">
              <Link to="/#compare-widget">
                <span>{copy.cta.button}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </SurfaceCard>
        </div>

        {/* SOURCES */}
        <div className="py-11">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            Sources
          </h2>
          <ul className="list-none">
            {SOURCES.map((src, i) => (
              <li
                key={src.n}
                className={`flex gap-3 py-3 text-[12px] ${i !== 0 ? "border-t border-rule" : ""}`}
              >
                <div className="w-5 h-5 rounded-full bg-paper-dark border border-rule flex items-center justify-center text-[10px] font-bold text-ink-60 flex-shrink-0">
                  {src.n}
                </div>
                <div>
                  <div className="font-semibold mb-0.5">{src.title}</div>
                  <div className="text-ink-60">
                    {src.org} ·{" "}
                    <a
                      href={src.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-ink-30 no-underline hover:underline"
                    >
                      {src.label}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-ink-30 pb-10">{copy.footerNote}</p>
      </Section>
    </>
  );
};

export default GuideMinatoChuo;
