import { Link } from "react-router";
import type { MetaArgs } from "react-router";
import { ArrowRight } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
import { GUIDES } from "@/lib/guides";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

export function meta(_args: MetaArgs) {
  return buildMeta({
    title: "Guides — City & Investment Guides | AiSumai (愛住)",
    description:
      "Editorial guides on Japan's housing market: city-vs-city investment analysis, neighborhood explainers, and renting tips for buyers and renters.",
    url: `${SITE_URL}/guides`,
  });
}

const Guides = () => {
  return (
    <Section width="wide" className="pt-16 pb-24">
      <div className="text-center mb-14">
        <Eyebrow rules className="mb-5">
          AiSumai Editorial
        </Eyebrow>
        <h1 className="font-display text-[clamp(32px,4.5vw,48px)] leading-[1.1] tracking-[-1px] text-ink mb-4">
          Guides
        </h1>
        <p className="text-[15px] text-ink-60 max-w-[560px] mx-auto leading-relaxed">
          Long-form analysis on Japan&apos;s housing market — city comparisons,
          neighborhood guides, and what&apos;s actually worth knowing before you buy or rent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            to={`/guides/${guide.slug}`}
            className="no-underline text-inherit group"
          >
            <SurfaceCard
              pad="none"
              className="h-full flex flex-col overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5"
            >
              <div className="aspect-[16/10] overflow-hidden bg-paper-dark">
                <img
                  src={guide.coverImage}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <Eyebrow size="sm" tone="muted">
                  {guide.category} · {guide.date}
                </Eyebrow>
                <h2 className="font-display text-[19px] leading-[1.3] tracking-[-0.2px] text-ink">
                  {guide.title}
                </h2>
                <p className="text-[13px] text-ink-60 leading-relaxed flex-1">
                  {guide.excerpt}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink mt-1">
                  Read guide
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </span>
              </div>
            </SurfaceCard>
          </Link>
        ))}
      </div>
    </Section>
  );
};

export default Guides;
