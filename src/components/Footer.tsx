import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-rule bg-paper">
      <div className="max-w-[1040px] mx-auto px-6 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 no-underline text-ink">
              <span className="font-display text-[20px] tracking-[-0.3px]">
                愛住 AiSumai
              </span>
            </Link>
            <p className="mt-3 text-[13px] text-ink-60 max-w-md leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-4 pb-2 border-b border-rule">
              {t("footer.platform")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/compare" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.compare")}
                </Link>
              </li>
              <li>
                <Link to="/feed" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.feed")}
                </Link>
              </li>
              <li>
                <Link to="/experts" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.experts")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-60 mb-4 pb-2 border-b border-rule">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/about" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.about")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.terms")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[13px] text-ink-60 hover:text-ink no-underline">
                  {t("footer.links.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-rule flex items-center justify-between flex-wrap gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-30">
            Phase 1 · 2026
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
