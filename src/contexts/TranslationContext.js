import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const fallbackLocale = 'en';
const supportedLocales = Object.keys(translations);

function getMessage(locale, key, fallback) {
  const segments = key.split('.');
  const traverse = (obj) => segments.reduce((acc, segment) => (acc ? acc[segment] : undefined), obj);
  return traverse(translations[locale]) ?? traverse(translations[fallbackLocale]) ?? fallback ?? key;
}

function detectLocale() {
  if (typeof window === 'undefined') return fallbackLocale;
  const stored = localStorage.getItem('locale');
  if (stored && supportedLocales.includes(stored)) {
    return stored;
  }
  const browser = navigator.language?.split('-')[0];
  if (browser && supportedLocales.includes(browser)) {
    return browser;
  }
  return fallbackLocale;
}

const TranslationContext = createContext({
  locale: fallbackLocale,
  setLocale: () => {},
  availableLocales: supportedLocales,
  t: (key, fallback) => fallback ?? key,
});

export function TranslationProvider({ children }) {
  const [locale, setLocale] = useState(() => detectLocale());

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      availableLocales: supportedLocales,
      t: (key, fallback) => getMessage(locale, key, fallback),
    }),
    [locale]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  return useContext(TranslationContext);
}


