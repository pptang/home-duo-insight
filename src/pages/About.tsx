import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Search,
  Users,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section, SectionDivider } from "@/components/ui/Section";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

const About = () => {
  const { t } = useTranslation();

  const steps = [
    {
      key: "ai",
      icon: Search,
      titleKey: "about.howItWorks.aiTitle",
      descriptionKey: "about.howItWorks.aiDescription",
    },
    {
      key: "expert",
      icon: Users,
      titleKey: "about.howItWorks.expertTitle",
      descriptionKey: "about.howItWorks.expertDescription",
    },
    {
      key: "community",
      icon: MessageSquare,
      titleKey: "about.howItWorks.communityTitle",
      descriptionKey: "about.howItWorks.communityDescription",
    },
  ] as const;

  const features = [
    {
      key: "fair",
      icon: Compass,
      titleKey: "about.features.fair.title",
      descriptionKey: "about.features.fair.description",
      tagKey: "about.features.fair.tag",
    },
    {
      key: "fast",
      icon: Sparkles,
      titleKey: "about.features.fast.title",
      descriptionKey: "about.features.fast.description",
      tagKey: "about.features.fast.tag",
    },
    {
      key: "trusted",
      icon: ShieldCheck,
      titleKey: "about.features.trusted.title",
      descriptionKey: "about.features.trusted.description",
      tagKey: "about.features.trusted.tag",
    },
  ] as const;

  const faqs = [1, 2, 3, 4, 5, 6] as const;

  return (
    <>
      {/* HERO */}
      <section className="px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(10,10,10,0.04) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-[860px] mx-auto text-center">
          <Eyebrow rules className="mb-5">
            {t("about.hero.eyebrow")}
          </Eyebrow>

          <h1 className="font-display text-[clamp(36px,5.4vw,64px)] leading-[1.1] tracking-[-1px] text-ink mb-6">
            {t("about.hero.heading")}
          </h1>

          <p className="text-[15px] sm:text-[16px] text-ink-60 max-w-[640px] mx-auto leading-relaxed mb-10">
            {t("about.hero.lede")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button asChild variant="editorial" size="editorial">
              <Link to="/compare">
                <span>{t("about.hero.ctaPrimary")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild variant="editorial-outline" size="editorial">
              <Link to="/feed">
                <span>{t("about.hero.ctaSecondary")}</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION DIVIDER */}
      <SectionDivider label={t("about.howItWorks.eyebrow")} />

      {/* HOW IT WORKS — 3 numbered steps */}
      <Section width="wide" className="pt-16 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.15] tracking-[-0.5px] text-ink mb-3">
            {t("about.howItWorks.title")}
          </h2>
          <p className="text-[14px] text-ink-60 max-w-[520px] mx-auto leading-relaxed">
            {t("about.howItWorks.subtitle")}
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const stepNumber = String(index + 1).padStart(2, "0");
            return (
              <li
                key={step.key}
                className="bg-paper p-6 sm:p-7 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <Eyebrow size="sm" tone="muted">
                    Step {stepNumber}
                  </Eyebrow>
                  <span className="w-9 h-9 border border-rule rounded-full flex items-center justify-center bg-paper-dark">
                    <Icon
                      className="w-4 h-4 text-ink"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <h3 className="font-display text-[20px] leading-[1.2] tracking-[-0.3px] text-ink">
                  {t(step.titleKey)}
                </h3>
                <p className="text-[13.5px] text-ink-60 leading-relaxed">
                  {t(step.descriptionKey)}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* SECTION DIVIDER */}
      <SectionDivider label={t("about.features.eyebrow")} />

      {/* FEATURES — 3 alternating layout */}
      <Section width="wide" className="pt-16 pb-20">
        <div className="flex flex-col gap-14 sm:gap-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const reversed = index % 2 === 1;
            return (
              <article
                key={feature.key}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center ${
                  reversed ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="flex flex-col gap-4">
                  <Eyebrow size="sm" tone="muted">
                    {t("about.features.featureLabel", { n: index + 1 })}
                  </Eyebrow>
                  <h3 className="font-display text-[clamp(24px,3vw,32px)] leading-[1.15] tracking-[-0.5px] text-ink">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-[14px] text-ink-60 leading-relaxed">
                    {t(feature.descriptionKey)}
                  </p>
                  <div className="inline-flex items-center gap-1.5 self-start font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60 border border-rule rounded-full px-2.5 py-1 bg-paper-dark">
                    <span className="w-1 h-1 rounded-full bg-ink/40" />
                    {t(feature.tagKey)}
                  </div>
                </div>

                <SurfaceCard
                  tone="paper-dark"
                  pad="none"
                  className="aspect-[4/3] relative overflow-hidden flex items-center justify-center"
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 30% 30%, rgba(10,10,10,0.05) 0%, transparent 60%)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3 text-ink-60">
                    <span className="w-16 h-16 border border-rule rounded-full flex items-center justify-center bg-paper">
                      <Icon
                        className="w-7 h-7 text-ink"
                        strokeWidth={1.25}
                        aria-hidden="true"
                      />
                    </span>
                    <Eyebrow size="sm" tone="muted">
                      {t("about.features.illustrationLabel")}
                    </Eyebrow>
                  </div>
                </SurfaceCard>
              </article>
            );
          })}
        </div>
      </Section>

      {/* SECTION DIVIDER */}
      <SectionDivider label={t("about.faq.eyebrow")} />

      {/* FAQ — native details/summary */}
      <Section width="narrow" className="pt-16 pb-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] leading-[1.15] tracking-[-0.5px] text-ink mb-3">
            {t("about.faq.title")}
          </h2>
          <p className="text-[14px] text-ink-60 max-w-[480px] mx-auto leading-relaxed">
            {t("about.faq.subtitle")}
          </p>
        </div>

        <SurfaceCard pad="none" className="divide-y divide-rule overflow-hidden">
          {faqs.map((n) => (
            <details
              key={n}
              className="group p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <span className="font-display text-[16px] sm:text-[17px] leading-[1.35] tracking-[-0.2px] text-ink">
                  {t(`about.faq.q${n}`)}
                </span>
                <span
                  className="flex-shrink-0 w-7 h-7 border border-rule rounded-full flex items-center justify-center text-ink-60 transition-transform duration-200 group-open:rotate-45 bg-paper-dark"
                  aria-hidden="true"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 1V9M1 5H9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-[13.5px] text-ink-60 leading-relaxed">
                {t(`about.faq.a${n}`)}
              </p>
            </details>
          ))}
        </SurfaceCard>
      </Section>

      {/* CTA STRIP */}
      <Section className="pb-24">
        <SurfaceCard
          tone="ink"
          pad="lg"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          <div className="flex-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-paper/50 block mb-2">
              {t("about.cta.eyebrow")}
            </span>
            <h2 className="font-display text-[clamp(22px,3vw,30px)] leading-[1.2] tracking-[-0.3px] text-paper">
              {t("about.cta.heading")}
            </h2>
            <p className="text-[13.5px] text-paper/70 leading-relaxed mt-2 max-w-[420px]">
              {t("about.cta.subtitle")}
            </p>
          </div>
          <Button
            asChild
            size="editorial"
            className="bg-paper text-ink font-medium tracking-[0.01em] hover:opacity-90 hover:-translate-y-0.5 transition-all flex-shrink-0"
          >
            <Link to="/compare">
              <span>{t("about.cta.button")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </SurfaceCard>
      </Section>
    </>
  );
};

export default About;
