import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { AuthButtons } from "@/components/AuthButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";

/**
 * Shared global navigation bar. The single source of truth for the AiSumai
 * top navigation — pages must not hand-roll their own header markup.
 */
const Topbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { to: "/#compare-widget", labelKey: "nav.compare" },
    { to: "/feed", labelKey: "nav.feed" },
    { to: "/experts", labelKey: "nav.experts" },
    { to: "/about", labelKey: "nav.about" },
    ...(user ? [{ to: "/dashboard", labelKey: "nav.dashboard" }] : []),
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 h-[52px] bg-paper/95 backdrop-blur-md border-b border-rule">
      <div className="h-full px-5 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-ink no-underline">
          <span className="font-display text-[18px] tracking-[-0.3px]">
            愛住 AiSumai
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-60 border border-rule rounded px-1.5 py-[2px]">
            Beta
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-[13px] no-underline rounded px-3.5 py-1.5 transition-colors hover:bg-ink/[0.06] hover:text-ink ${
                isActive(item.to)
                  ? "text-ink font-medium"
                  : "text-ink-60"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <AuthButtons />
        </div>

        {/* Mobile button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden min-h-[44px] min-w-[44px] -mr-1 flex items-center justify-center text-ink rounded hover:bg-ink/[0.06]"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-[52px] bg-paper/98 z-40 flex flex-col items-center justify-center gap-6 animate-in">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="font-display text-[26px] text-ink no-underline"
              onClick={() => setIsOpen(false)}
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <div className="flex flex-col gap-2.5 w-[260px] mt-4">
            <LanguageSwitcher />
            <AuthButtons />
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
