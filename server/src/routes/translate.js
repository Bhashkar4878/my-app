const express = require('express');

const router = express.Router();

const libreKey = process.env.LIBRE_TRANSLATE_API_KEY || null;
const endpointCandidates = Array.from(
  new Set([
    process.env.LIBRE_TRANSLATE_URL,
    'http://127.0.0.1:5000/translate',
    'https://libretranslate.com/translate',
  ])
).filter(Boolean);

const fetchFn =
  typeof globalThis.fetch === 'function'
    ? globalThis.fetch.bind(globalThis)
    : (...args) =>
        import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function performTranslation(endpoint, payload) {
  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Provider responded ${response.status}: ${detail || 'no detail'}`);
  }

  const data = await response.json();
  const translated = data.translatedText || data.translation || data.text;
  if (!translated) {
    throw new Error('Provider returned empty translation payload');
  }
  return translated;
}

async function translateWithFallback(text, targetLang) {
  const payload = {
    q: text,
    source: 'auto',
    target: targetLang,
    format: 'text',
    ...(libreKey ? { api_key: libreKey } : {}),
  };

  let lastError = null;
  for (const endpoint of endpointCandidates) {
    try {
      return await performTranslation(endpoint, payload);
    } catch (err) {
      lastError = err;
      console.error(`Translate via ${endpoint} failed`, err.message);
    }
  }

  const error = new Error(lastError?.message || 'Unknown translation error');
  error.statusCode = 502;
  throw error;
}

router.post('/', async (req, res) => {
  const { text, targetLang } = req.body || {};

  if (!text || !targetLang) {
    return res.status(400).json({ message: 'Text and targetLang are required' });
  }

  try {
    const translated = await translateWithFallback(text, targetLang);
    return res.json({ translated });
  } catch (err) {
    return res
      .status(err.statusCode || 502)
      .json({ message: 'Translation provider error', detail: err.message });
  }
});

router.post('/batch', async (req, res) => {
  const { texts, targetLang } = req.body || {};

  if (!targetLang || !Array.isArray(texts) || texts.length === 0) {
    return res
      .status(400)
      .json({ message: 'texts (array) and targetLang are required' });
  }

  try {
    const translations = [];
    for (const text of texts) {
      translations.push(await translateWithFallback(text, targetLang));
    }
    return res.json({ translations });
  } catch (err) {
    return res
      .status(err.statusCode || 502)
      .json({ message: 'Translation provider error', detail: err.message });
  }
});

module.exports = router;


