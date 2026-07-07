/**
 * i18n System — Per-page translation files
 *
 * Each page has its own translation file under /i18n/pages/<pageName>.ts
 * The usePageTranslation hook loads translations for the current page
 * and merges them with the global translations from LanguageContext.
 */
import { useCallback } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

export type TranslationDict = Record<string, Record<Language, string>>;

// Registry of page translations (lazy-loaded)
const pageTranslations: Record<string, TranslationDict> = {};

export function registerPageTranslations(pageName: string, dict: TranslationDict) {
  pageTranslations[pageName] = dict;
}

/**
 * Hook that provides translation function for a specific page.
 * Falls back to global translations from LanguageContext if key not found in page dict.
 */
export function usePageTranslation(pageName: string) {
  const { lang, setLang, t: globalT } = useLanguage();

  const t = useCallback(
    (key: string): string => {
      // First check page-specific translations
      const pageDict = pageTranslations[pageName];
      if (pageDict && pageDict[key]) {
        return pageDict[key][lang] || pageDict[key]["th"] || key;
      }
      // Fall back to global translations
      return globalT(key);
    },
    [pageName, lang, globalT]
  );

  return { lang, setLang, t };
}

export type { Language };
