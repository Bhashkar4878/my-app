import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import api from '../api';
import translations, { dynamicLocales, baseLocale, baseStrings } from '../i18n/translations';

const fallbackLocale = baseLocale || 'en';
const staticLocales = Object.keys(translations);
const supportedLocales = Array.from(new Set([...staticLocales, ...dynamicLocales]));
const dynamicLocaleSet = new Set(dynamicLocales);

function traverseMessage(obj, key) {
  if (!obj) return undefined;
  const segments = key.split('.');
  return segments.reduce((acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined), obj);
}

function flattenMessages(obj, prefix = '') {
  const entries = [];
  Object.entries(obj || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenMessages(value, path));
    } else {
      entries.push({ key: path, value: String(value) });
    }
  });
  return entries;
}

const baseEntries = flattenMessages(baseStrings);
const baseKeys = baseEntries.map((entry) => entry.key);
const baseTexts = baseEntries.map((entry) => entry.value);

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
  const [dynamicMessages, setDynamicMessages] = useState({});
  const [loadingLocales, setLoadingLocales] = useState({});

  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const requiresDynamic = dynamicLocaleSet.has(locale) && !translations[locale];
  const hasDynamicPack = Boolean(dynamicMessages[locale] && Object.keys(dynamicMessages[locale]).length);
  const isLoadingLocale = Boolean(loadingLocales[locale]);

  useEffect(() => {
    if (!requiresDynamic || hasDynamicPack || isLoadingLocale) {
      return undefined;
    }

    let cancelled = false;
    async function loadLocalePack() {
      setLoadingLocales((prev) => ({ ...prev, [locale]: true }));
      try {
        const response = await api.translate.batch(baseTexts, locale);
        const translatedList = Array.isArray(response?.translations) ? response.translations : [];
        if (translatedList.length !== baseKeys.length) {
          throw new Error('Incomplete translation payload');
        }
        const map = {};
        baseKeys.forEach((key, idx) => {
          map[key] = translatedList[idx] || traverseMessage(translations[fallbackLocale], key) || '';
        });
        if (!cancelled) {
          setDynamicMessages((prev) => ({ ...prev, [locale]: map }));
        }
      } catch (err) {
        console.error(`Failed to load locale "${locale}"`, err);
        if (!cancelled) {
          setDynamicMessages((prev) => ({ ...prev, [locale]: {} }));
        }
      } finally {
        if (!cancelled) {
          setLoadingLocales((prev) => ({ ...prev, [locale]: false }));
        }
      }
    }

    loadLocalePack();
    return () => {
      cancelled = true;
    };
  }, [locale, requiresDynamic, hasDynamicPack, isLoadingLocale]);

  const translateFn = useCallback(
    (key, fallback) => {
      const staticValue = traverseMessage(translations[locale], key);
      if (staticValue !== undefined) {
        return staticValue;
      }
      const dynamicValue = dynamicMessages[locale]?.[key];
      if (dynamicValue !== undefined) {
        return dynamicValue;
      }
      const baseValue = traverseMessage(translations[fallbackLocale], key);
      return baseValue ?? fallback ?? key;
    },
    [locale, dynamicMessages]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      availableLocales: supportedLocales,
      t: translateFn,
    }),
    [locale, translateFn]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  return useContext(TranslationContext);
}


