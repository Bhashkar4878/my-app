import { useEffect, useState } from 'react';
import api from '../api';
import { useTranslation } from '../contexts/TranslationContext';

export default function useContentTranslation(text) {
  const { locale, t } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTranslated(null);
    setError('');
    setLoading(false);
  }, [text, locale]);

  async function toggle() {
    if (loading) return;

    if (translated) {
      setTranslated(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.translate.text(text, locale);
      setTranslated(res.translated || res.translatedText || res.translation || text);
    } catch (e) {
      setError(t('translate.error'));
    } finally {
      setLoading(false);
    }
  }

  return {
    text: translated ?? text,
    hasTranslation: Boolean(translated),
    loading,
    error,
    toggle,
  };
}


