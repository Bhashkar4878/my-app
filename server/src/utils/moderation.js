const ABUSE_KEYWORDS = [
  'idiot',
  'stupid',
  'moron',
  'trash',
  'loser',
  'shut up',
  'worthless',
  'kys',
];

const HATE_KEYWORDS = [
  'hate speech',
  'exterminate',
  'inferior',
  'purge',
  'genocide',
  'nazis',
  'racist',
  'terrorist group',
];

const SPAM_PHRASES = [
  'free money',
  'work from home',
  'buy now',
  'limited time offer',
  'click here',
  'visit my profile',
  '100% real',
  'dm for details',
];

const MISLEADING_PHRASES = [
  'miracle cure',
  'guaranteed results',
  'secret government',
  'hidden truth',
  'vaccines cause',
  'flat earth',
  'fake news confirmed',
];

const URL_REGEX = /(https?:\/\/|www\.)\S+/gi;

function detectKeywordMatch(text, keywords) {
  const lowered = text.toLowerCase();
  return keywords.find((word) => lowered.includes(word));
}

function detectSpamSignals(text) {
  const matches = [];
  const urls = text.match(URL_REGEX) || [];
  if (urls.length >= 2) {
    matches.push('contains multiple links');
  }

  const repeatedWords = text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (repeatedWords.length) {
    const counts = repeatedWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    if (Object.values(counts).some((count) => count >= 5)) {
      matches.push('excessive repetition');
    }
  }

  if (text.length > 150 && text.includes('!!!')) {
    matches.push('aggressive punctuation');
  }

  const spamPhrase = detectKeywordMatch(text, SPAM_PHRASES);
  if (spamPhrase) {
    matches.push(`contains spam phrase "${spamPhrase}"`);
  }

  return matches;
}

function evaluatePostContent(content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return { isAllowed: false, reasons: [{ category: 'abuse', detail: 'content empty' }] };
  }

  const reasons = [];

  const abuseMatch = detectKeywordMatch(trimmed, ABUSE_KEYWORDS);
  if (abuseMatch) {
    reasons.push({ category: 'abuse', detail: `contains abusive term "${abuseMatch}"` });
  }

  const hateMatch = detectKeywordMatch(trimmed, HATE_KEYWORDS);
  if (hateMatch) {
    reasons.push({ category: 'hate_speech', detail: `references hate speech term "${hateMatch}"` });
  }

  const spamSignals = detectSpamSignals(trimmed);
  spamSignals.forEach((signal) =>
    reasons.push({ category: 'spam', detail: signal })
  );

  const misleadingMatch = detectKeywordMatch(trimmed, MISLEADING_PHRASES);
  if (misleadingMatch) {
    reasons.push({ category: 'misleading', detail: `contains misleading phrase "${misleadingMatch}"` });
  }

  return { isAllowed: reasons.length === 0, reasons };
}

module.exports = { evaluatePostContent };


