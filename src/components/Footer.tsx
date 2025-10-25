import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-softgray">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">{t("footer.brand")}</span>
              <span className="text-xl font-medium text-gray-700">{t("footer.brand_suffix")}</span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">{t("footer.platform")}</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/compare" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.compare")}
                </Link>
              </li>
              <li>
                <Link to="/feed" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.feed")}
                </Link>
              </li>
              <li>
                <Link to="/experts" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.experts")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">{t("footer.company")}</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link to="/about" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.about")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.terms")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-base text-gray-600 hover:text-primary">
                  {t("footer.links.contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-500 text-center">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
