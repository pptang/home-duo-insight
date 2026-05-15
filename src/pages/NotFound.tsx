import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main className="flex items-center justify-center py-24 px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="font-display text-[clamp(48px,8vw,72px)] leading-[1.1] tracking-[-1px] text-ink mb-4">
          {t("notFound.title")}
        </h1>
        <h2 className="font-display text-[22px] tracking-[-0.3px] text-ink mb-4">
          {t("notFound.heading")}
        </h2>
        <p className="text-[14px] text-ink-60 leading-relaxed mb-8">
          {t("notFound.description")}
        </p>
        <Button asChild variant="editorial" size="editorial">
          <Link to="/">
            <Home className="h-4 w-4" /> {t("notFound.backToHome")}
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
