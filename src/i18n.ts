import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/en/translation.json";
import jaTranslation from "./locales/ja/translation.json";
import zhTWTranslation from "./locales/zh-TW/translation.json";

const isServer = typeof window === "undefined";

// Captured BEFORE i18next.init() runs below. Client init forces lng:"en" (see
// comment on baseConfig.lng); i18next fires a languageChanged event as part
// of init even when lng is forced rather than detected, and LanguageDetector
// (registered for its localStorage caching side-effect) caches whatever the
// current language is on every languageChanged event — so by the time
// anything reads localStorage after init, "en" has already overwritten the
// user's real saved preference. root.tsx's post-hydration upgrade effect
// reads this captured snapshot instead of re-querying localStorage, so a
// saved "ja"/"zh-TW" preference survives full page loads and direct
// navigation, not just same-tab SPA transitions.
export const storedLngAtLoad = isServer ? null : localStorage.getItem("i18nextLng");

// Shared base config — keeps server and client in sync; avoids drift.
const baseConfig = {
  // IMPORTANT: lng MUST be "en" on both server and client initial render.
  // Client upgrades to the detected language post-hydration (see root.tsx).
  // If lng is omitted, LanguageDetector runs synchronously and picks "ja"
  // for JA browsers, causing a text-node mismatch against the SSR "en" HTML.
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ja", "zh-TW"],
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: enTranslation },
    ja: { translation: jaTranslation },
    "zh-TW": { translation: zhTWTranslation },
  },
};

if (isServer) {
  // Server: no LanguageDetector (window/localStorage/navigator unavailable).
  i18n.use(initReactI18next).init(baseConfig);
} else {
  // Client: register LanguageDetector for its localStorage caching side-effect,
  // but force lng:"en" so the initial synchronous render matches SSR HTML.
  // Language upgrade to the detected locale happens in root.tsx useEffect after
  // hydration, preventing "Text content did not match" on translated strings.
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      ...baseConfig,
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });
}

export default i18n;
