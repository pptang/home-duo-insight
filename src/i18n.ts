import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslation from "./locales/en/translation.json";
import jaTranslation from "./locales/ja/translation.json";

const isServer = typeof window === "undefined";

const resources = {
  en: { translation: enTranslation },
  ja: { translation: jaTranslation },
};

if (isServer) {
  // Server-side: fixed language, no detector, prevents hydration mismatch
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "ja"],
    interpolation: { escapeValue: false },
    resources,
  });
} else {
  // Client-side: use browser language detector
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      supportedLngs: ["en", "ja"],
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
      interpolation: { escapeValue: false },
      resources,
    });
}

export default i18n;
