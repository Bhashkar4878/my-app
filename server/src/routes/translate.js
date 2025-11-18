const express = require('express');

const router = express.Router();

const libreUrl = process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.com/translate';
const libreKey = process.env.LIBRE_TRANSLATE_API_KEY || null;

router.post('/', async (req, res) => {
  const { text, targetLang } = req.body || {};

  if (!text || !targetLang) {
    return res.status(400).json({ message: 'Text and targetLang are required' });
  }

  try {
    const response = await fetch(libreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target: targetLang,
        format: 'text',
        ...(libreKey ? { api_key: libreKey } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ message: 'Translation provider error', detail });
    }

    const data = await response.json();
    const translated = data.translatedText || data.translation || data.text;

    return res.json({ translated });
  } catch (err) {
    console.error('Translate error', err);
    return res.status(500).json({ message: 'Translation failed' });
  }
});

module.exports = router;


