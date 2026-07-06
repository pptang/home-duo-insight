import { Link } from "react-router";
import type { MetaArgs } from "react-router";
import { ArrowUp, TriangleAlert, ArrowRight, ArrowLeft } from "lucide-react";
import { SITE_URL, OG_IMAGE_URL } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

// Static editorial content page — first entry in the /guides series
// (bead: compare/fukuoka-vs-osaka regional analysis).
// No loader — the article body is fixed research content, not DB-backed.

const IMG_BASE = "/images/compare/fukuoka-vs-osaka";

export function meta(_args: MetaArgs) {
  const title = "福岡市 vs 大阪市 — 2026年投資分析 | AiSumai 愛住";
  const description =
    "2026年現在、福岡と大阪のどちらが不動産投資に有利か。天神ビッグバンとなにわ筋線沿線を軸に、次の価格上昇が織り込まれていないエリアを分析。";
  const ogTitle = "Fukuoka vs Osaka — Where Is the Next Move Not Yet Priced In?";
  const ogDescription =
    "For investors entering in 2026, the question is not who grew faster — it's where the next catalyst hasn't been priced in yet.";
  const url = `${SITE_URL}/guides/fukuoka-vs-osaka`;

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

function ScoreCell({
  tone,
  children,
}: {
  tone?: "good" | "mid" | "risk";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "text-risk-low font-semibold"
      : tone === "mid"
        ? "text-risk-med font-semibold"
        : tone === "risk"
          ? "text-risk-high font-semibold"
          : "";
  return <div className={`p-3 text-[12px] leading-[1.4] ${toneClass}`}>{children}</div>;
}

const GuideFukuokaOsaka = () => {
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
        <svg
          viewBox="0 0 900 360"
          width="100%"
          className="block rounded-xl mt-2"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="cl">
              <polygon points="0,0 486,0 432,360 0,360" />
            </clipPath>
            <clipPath id="cr">
              <polygon points="498,0 900,0 900,360 444,360" />
            </clipPath>
          </defs>
          <polygon points="0,0 486,0 432,360 0,360" fill="#FDEBD0" />
          <polygon points="498,0 900,0 900,360 444,360" fill="#D6EAF8" />
          <g clipPath="url(#cl)">
            <image href={`${IMG_BASE}/img-fukuoka-mentaiko.png`} x="30" y="30" width="180" height="150" />
            <image href={`${IMG_BASE}/img-fukuoka-strawberry.png`} x="220" y="40" width="150" height="130" />
            <image href={`${IMG_BASE}/img-fukuoka-comedian.png`} x="120" y="190" width="170" height="150" />
          </g>
          <g clipPath="url(#cr)">
            <image href={`${IMG_BASE}/img-osaka-takoyaki.png`} x="560" y="40" width="180" height="140" />
            <image href={`${IMG_BASE}/img-osaka-tsutenkaku.png`} x="680" y="150" width="150" height="180" />
          </g>
          <circle cx="450" cy="180" r="30" fill="white" stroke="#0D0D0D" strokeWidth="3" />
          <text
            x="450"
            y="186"
            textAnchor="middle"
            fontFamily="'DM Sans',sans-serif"
            fontSize="15"
            fontWeight="700"
            fill="#0D0D0D"
          >
            VS
          </text>
          <text
            x="20"
            y="316"
            fontFamily="'Noto Serif JP',Georgia,serif"
            fontSize="62"
            fontWeight="900"
            fill="#0D0D0D"
            letterSpacing="-2"
          >
            福岡
          </text>
          <text
            x="24"
            y="344"
            fontFamily="'DM Sans',sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="#666"
            letterSpacing="5"
          >
            FUKUOKA
          </text>
          <text
            x="880"
            y="316"
            textAnchor="end"
            fontFamily="'Noto Serif JP',Georgia,serif"
            fontSize="62"
            fontWeight="900"
            fill="#0D0D0D"
            letterSpacing="-2"
          >
            大阪
          </text>
          <text
            x="876"
            y="344"
            textAnchor="end"
            fontFamily="'DM Sans',sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="#666"
            letterSpacing="5"
          >
            OSAKA
          </text>
        </svg>

        {/* ARTICLE HEADER */}
        <header className="pt-9 pb-8 border-b border-rule">
          <Eyebrow size="sm" tone="muted" className="mb-4">
            Investment Analysis · Japan · July 2026
          </Eyebrow>
          <h1 className="font-display text-[clamp(28px,4.5vw,42px)] font-black leading-[1.1] tracking-[-1px] text-ink mb-4">
            Fukuoka vs Osaka:
            <br />
            <em className="italic font-normal">Where is the next move not yet priced in?</em>
          </h1>
          <p className="text-[17px] text-ink-60 font-light leading-[1.65] border-l-[3px] border-ink pl-4">
            Most investors compare +58% vs +32% and call it done. That&apos;s the wrong question.
            For anyone entering in 2026, what matters is not what already happened — it&apos;s
            which market still has a catalyst the price hasn&apos;t caught up with.
          </p>
          <div className="text-[11px] text-ink-30 mt-5 flex gap-5 flex-wrap">
            <span>AiSumai Editorial</span>
            <span>·</span>
            <span>July 2026</span>
            <span>·</span>
            <span>Research: Q1 2026 data</span>
          </div>
        </header>

        {/* SECTION 1: THE WRONG QUESTION */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            Stop comparing past returns
          </h2>
          <p className="text-ink-80 leading-[1.82] mb-4">
            When investors line up Fukuoka&apos;s five-year used-condo growth of +58.3% against
            Osaka&apos;s +32.8%, they are reading a rear-view mirror. Both numbers describe what
            already happened. Neither tells you what a 2026 buyer is actually paying for — or
            what they are not yet paying for.
          </p>
          <p className="text-ink-80 leading-[1.82]">
            There is a more useful question: in which market has the price not yet caught up with
            what is about to happen?
          </p>

          <SurfaceCard tone="ink" pad="lg" className="my-8 !p-7 sm:!p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 mb-3">
              The argument this article makes
            </div>
            <div className="font-display italic text-[clamp(18px,2.8vw,22px)] leading-[1.5] text-paper">
              &ldquo;Fukuoka&apos;s growth story is real — and fully priced. Osaka&apos;s next
              chapter has not been written into most property prices yet. The opportunity in 2026
              is not in the city with the better recent track record. It&apos;s in the
              neighbourhood that 2031 will transform.&rdquo;
            </div>
          </SurfaceCard>
        </div>

        {/* SECTION 2: FUKUOKA */}
        <div className="py-11 border-b border-rule">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="font-['Noto_Serif_JP',serif] text-[42px] font-black leading-none tracking-[-1px]">
                福岡
              </div>
              <span className="text-[11px] font-bold tracking-[4px] text-ink-60 block mt-1.5">
                FUKUOKA
              </span>
            </div>
            <span className="text-[12px] font-bold tracking-[0.3px] px-4 py-1.5 rounded-full whitespace-nowrap mt-1.5 bg-[#FDEBD0] text-[#7A4A00]">
              A Known Story at a Full Price
            </span>
          </div>

          <p className="text-ink-80 leading-[1.82] mb-4">
            Everything good about Fukuoka is true. Population growing at the fastest rate of any
            major Japanese city. 20–39 year-olds at 25% of residents, against a national average
            of 16%. Two massive government-backed redevelopment programs — 天神ビッグバン and
            博多コネクティッド — rebuilding the city center from the ground up. A 2023 subway
            extension that directly links Tenjin and Hakata for the first time.
          </p>

          <div className="border-t-[3px] border-ink pt-6 pb-5 my-8">
            <div className="font-display text-[clamp(52px,9vw,80px)] font-black leading-[0.9] tracking-[-3px]">
              ¥278M
            </div>
            <div className="text-[14px] font-medium mt-2.5 max-w-[520px] leading-[1.55]">
              Average asking price for a 一棟マンション in Fukuoka, Q4 2025 — within ¥4M of
              Tokyo&apos;s 23-ward average of ¥282M.
            </div>
            <div className="text-[11px] text-ink-30 mt-1.5">
              Source: 健美家 quarterly report, January 2026 [1]
            </div>
          </div>

          <p className="text-ink-80 leading-[1.82] mb-4">
            That number is the signal. Five years ago, Fukuoka was a &ldquo;cheap regional
            city.&rdquo; That arbitrage is gone. Central Fukuoka now trades at Tokyo pricing
            because the story — population growth, redevelopment, the airport — is no longer
            unknown. It is in every investment seminar and real estate magazine in Hong Kong,
            Taiwan, and Singapore.
          </p>

          <p className="text-ink-80 leading-[1.82] mb-6">
            When a story becomes consensus, it gets priced in. The investor who buys central
            Fukuoka in 2026 is not buying an undiscovered opportunity. They are paying a premium
            for certainty — certainty that demand will continue, that the city will keep growing,
            that the 七隈線 corridor will keep expanding rental zones. That certainty has real
            value. But it limits upside.
          </p>

          <div className="border border-rule rounded-[10px] p-5 grid grid-cols-[auto_1fr] gap-3.5 items-start">
            <div className="w-8 h-8 rounded-full bg-paper-dark border border-rule flex items-center justify-center flex-shrink-0 mt-px">
              <ArrowUp className="w-4 h-4 text-ink" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-[13px] mb-1">Where Fukuoka still has room</div>
              <div className="text-[13px] text-ink-60 leading-[1.6]">
                Station neighborhoods along the 七隈線 extension — Yakuin, Tenjin-Minami,
                Rokuro-mae — have not fully re-rated to match central Tenjin. Structural demand is
                real; entry prices are still relative value. This is where a Fukuoka buyer should
                be looking in 2026, not at already-repriced central assets.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: OSAKA */}
        <div className="py-11 border-b border-rule">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <div className="font-['Noto_Serif_JP',serif] text-[42px] font-black leading-none tracking-[-1px]">
                大阪
              </div>
              <span className="text-[11px] font-bold tracking-[4px] text-ink-60 block mt-1.5">
                OSAKA
              </span>
            </div>
            <span className="text-[12px] font-bold tracking-[0.3px] px-4 py-1.5 rounded-full whitespace-nowrap mt-1.5 bg-[#1A3A5C] text-white">
              The Next Chapter Is Still Being Written
            </span>
          </div>

          <p className="text-ink-80 leading-[1.82] mb-4">
            Osaka&apos;s reputation in 2026 is muddled, which is exactly why it is interesting.
            The Expo is over. Some of the Expo-driven price gains have faded — particularly in
            bay-area locations that moved on proximity to Yumeshima and nothing structural
            underneath. Central areas like 梅田 and 難波 never needed the Expo; their vacancy
            rates and rents are solid and will remain so.
          </p>

          <p className="text-ink-80 leading-[1.82] mb-4">
            But none of that is where the opportunity is.
          </p>

          <div className="border-t-[3px] border-ink pt-6 pb-5 my-8">
            <div className="font-display text-[clamp(52px,9vw,80px)] font-black leading-[0.9] tracking-[-3px]">
              2031
            </div>
            <div className="text-[14px] font-medium mt-2.5 max-w-[520px] leading-[1.55]">
              The year なにわ筋線 opens — connecting Osaka Station to 中之島, 西本町, JR難波, and
              新今宮, with direct access to Kansai International Airport. Neighbourhoods along
              this corridor are currently priced at 2026 accessibility.
            </div>
            <div className="text-[11px] text-ink-30 mt-1.5">
              Sources: JLL Japan, February 2026 [2] · 青山地所, December 2025 [3]
            </div>
          </div>

          <p className="text-ink-80 leading-[1.82] mb-4">
            The なにわ筋線 is a 7.2km north-south line running underground through central Osaka.
            When it opens in 2031, it will create a new direct axis from the main employment hub
            at 梅田 through 中之島 (an established business district), 西本町, and down to 難波 —
            and crucially, provide one of the fastest connections to Kansai International Airport
            of any station in central Osaka.
          </p>

          <p className="text-ink-80 leading-[1.82] mb-6">
            The 西区 land price data already shows early anticipation: +9.1% in a single year,
            driven partly by なにわ筋線 expectations. But that repricing is early. In 2026, 中之島
            and 西本町 are still priced as commuter-inconvenient neighbourhoods. In 2031, they
            will be premium addresses. Five years is exactly the holding period most investors
            target.
          </p>

          <div className="border border-rule rounded-[10px] p-5 grid grid-cols-[auto_1fr] gap-3.5 items-start">
            <div className="w-8 h-8 rounded-full bg-paper-dark border border-rule flex items-center justify-center flex-shrink-0 mt-px">
              <TriangleAlert className="w-4 h-4 text-ink" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <div className="font-bold text-[13px] mb-1">The risk to price in</div>
              <div className="text-[13px] text-ink-60 leading-[1.6]">
                Infrastructure projects in Japan run late. JR九州 cancelled the
                博多空中都市プロジェクト in September 2025. If なにわ筋線 is delayed
                significantly, you still own property in functional, inhabited neighbourhoods —
                but the repricing catalyst moves out. This is a timing risk, not a fundamental
                demand risk. The population of central Osaka (2.75M, slight net inflow) does not
                disappear.
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: SCORECARD */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            Risk-reward scorecard for 2026 investors
          </h2>
          <p className="text-[13px] text-ink-60 mb-5">
            Three scenarios a ¥100M buyer should compare — not just two cities.
          </p>

          <div className="border border-rule rounded-xl overflow-hidden overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-4 bg-ink text-paper">
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3] bg-white/[0.06]">
                  Factor
                </div>
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3]">
                  Fukuoka
                  <br />
                  Central
                </div>
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3]">
                  Osaka
                  <br />
                  梅田/難波
                </div>
                <div className="p-3 text-[10px] font-bold uppercase tracking-[1px] leading-[1.3]">
                  Osaka
                  <br />
                  なにわ筋線 corridor
                </div>
              </div>

              <div className="grid grid-cols-4 border-t border-rule">
                <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                  Current rental yield
                </div>
                <ScoreCell tone="mid">4–6%</ScoreCell>
                <ScoreCell tone="good">4.5–5.5%</ScoreCell>
                <ScoreCell tone="good">5–6.5%</ScoreCell>
              </div>
              <div className="grid grid-cols-4 border-t border-rule">
                <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                  Capital gain upside
                  <br />
                  (2026–2031)
                </div>
                <ScoreCell tone="mid">Moderate — story is priced</ScoreCell>
                <ScoreCell tone="mid">Limited — consensus buy</ScoreCell>
                <ScoreCell tone="good">High if line opens on schedule</ScoreCell>
              </div>
              <div className="grid grid-cols-4 border-t border-rule">
                <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                  Demand certainty
                </div>
                <ScoreCell tone="good">Very high — structural</ScoreCell>
                <ScoreCell tone="good">High — established</ScoreCell>
                <ScoreCell tone="mid">Medium — needs line to open</ScoreCell>
              </div>
              <div className="grid grid-cols-4 border-t border-rule">
                <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                  Entry price risk
                </div>
                <ScoreCell tone="risk">High — near Tokyo pricing</ScoreCell>
                <ScoreCell tone="mid">Medium</ScoreCell>
                <ScoreCell tone="good">Low — still early pricing</ScoreCell>
              </div>
              <div className="grid grid-cols-4 border-t border-rule">
                <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                  Liquidity / exit
                </div>
                <ScoreCell tone="good">Growing market</ScoreCell>
                <ScoreCell tone="good">Deep, liquid</ScoreCell>
                <ScoreCell tone="mid">Improving with line</ScoreCell>
              </div>
              <div className="grid grid-cols-4 border-t border-rule">
                <div className="p-3 bg-paper-dark text-ink-60 font-semibold text-[11px]">
                  Key risk
                </div>
                <ScoreCell tone="risk">Overpaying for known story</ScoreCell>
                <ScoreCell tone="mid">Limited upside</ScoreCell>
                <ScoreCell tone="mid">Infrastructure delay</ScoreCell>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: OUR READ */}
        <div className="py-11 border-b border-rule">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.3px] leading-[1.25] mb-4">
            The honest read
          </h2>
          <p className="text-ink-80 leading-[1.82] mb-4">
            Fukuoka is a city most investors already understand. That is its value — and its
            limitation. You are paying for clarity. Central assets will continue to perform
            steadily. The real value in Fukuoka in 2026 is in catching neighborhoods that
            structural demand hasn&apos;t fully reached yet, not in buying what everyone is
            already talking about.
          </p>
          <p className="text-ink-80 leading-[1.82] mb-4">
            Osaka in 2026 is more complex, which means it is less crowded with consensus buyers.
            The central core is priced efficiently and offers stable income. But the なにわ筋線
            corridor — 中之島, 西本町, the northern stretch toward 新今宮 — sits at an asymmetric
            moment: priced for today, potentially worth considerably more by 2031. That asymmetry
            is what serious investors look for.
          </p>
          <p className="text-ink-80 leading-[1.82]">
            In property, the stories that everyone already knows rarely produce outsized returns.
            The ones worth finding are the stories where the price has not yet caught up with
            what is coming.
          </p>
        </div>

        {/* CTA */}
        <div className="py-11 border-b border-rule">
          <SurfaceCard tone="paper-dark" pad="lg" className="text-center">
            <h3 className="font-display text-[21px] mb-2">Compare specific listings</h3>
            <p className="text-[13px] text-ink-60 mb-5 max-w-[360px] mx-auto">
              Paste two SUUMO links — one in each city. AI delivers a full side-by-side in 60
              seconds.
            </p>
            <Button asChild variant="editorial" size="editorial">
              <Link to="/#compare-widget">
                <span>Start comparing</span>
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
            {[
              {
                n: 1,
                title: "収益物件 市場動向四半期レポート Q4 2025",
                org: "健美家株式会社 · January 2026",
                href: "https://prtimes.jp/main/html/rd/p/000000803.000033058.html",
                label: "prtimes.jp",
              },
              {
                n: 2,
                title: "2026年以降の大阪不動産投資市場の展望",
                org: "JLL Japan · February 2026",
                href: "https://www.jll.com/ja-jp/insights/discussion-on-the-outlook-for-the-osaka-real-estate-investment-market",
                label: "jll.com/ja-jp",
              },
              {
                n: 3,
                title: "大阪市 不動産投資で安定収益を得る方法 2025年版",
                org: "株式会社青山地所 · December 2025",
                href: "https://aoyama-e.com/12970/osaka-fudosan-toushi-20251218-e575/",
                label: "aoyama-e.com",
              },
              {
                n: 4,
                title: "天神ビッグバン 2026年最新進捗レポート",
                org: "えんfunding · January 2026",
                href: "https://en-funding.en-hd.jp/column/column.html?article_id=231",
                label: "en-funding.en-hd.jp",
              },
              {
                n: 5,
                title: "大阪 地価回復——なにわ筋線 西区 +9.1% 上昇",
                org: "健美家 · October 2023",
                href: "https://www.kenbiya.com/ar/ns/research/china/7215.html",
                label: "kenbiya.com",
              },
            ].map((src, i) => (
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

        <p className="text-center text-[11px] text-ink-30 pb-10">
          AiSumai 愛住 · Not financial advice · 投資助言ではありません
        </p>
      </Section>
    </>
  );
};

export default GuideFukuokaOsaka;
