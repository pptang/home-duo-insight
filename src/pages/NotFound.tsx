import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center bg-softgray">
        <div className="text-center px-4 py-16">
          <h1 className="text-6xl font-bold text-primary mb-4">{t("notFound.title")}</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {t("notFound.heading")}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            {t("notFound.description")}
          </p>
          <Button asChild size="lg">
            <Link to="/" className="flex items-center">
              <Home className="mr-2 h-5 w-5" /> {t("notFound.backToHome")}
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
