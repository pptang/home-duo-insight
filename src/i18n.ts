import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/en/translation.json";
import jaTranslation from "./locales/ja/translation.json";

const isServer = typeof window === "undefined";

// Shared base config — keeps server and client in sync; avoids drift.
const baseConfig = {
  // IMPORTANT: lng MUST be "en" on both server and client initial render.
  // Client upgrades to the detected language post-hydration (see root.tsx).
  // If lng is omitted, LanguageDetector runs synchronously and picks "ja"
  // for JA browsers, causing a text-node mismatch against the SSR "en" HTML.
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ja"],
  interpolation: { escapeValue: false },
  resources: {
    en: { translation: enTranslation },
    ja: { translation: jaTranslation },
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
