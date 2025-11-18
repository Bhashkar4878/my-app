import React, { useMemo } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import '../styles/app.css';

const LANGUAGE_NAMES = {
en: 'English',
hi: 'Hindi',
de: 'German',
fr: 'French',
zh: 'Chinese',
ar: 'Arabic',
el: 'Greek',
ga: 'Irish',
ja: 'Japanese',
ko: 'Korean',
ru: 'Russian',
tr: 'Turkish',
ur: 'Urdu',
};

export default function LanguageSwitcher(){
const { locale, setLocale, availableLocales, t } = useTranslation();
const options = useMemo(() => availableLocales.map(code => ({
code,
label: LANGUAGE_NAMES[code] || code.toUpperCase(),
})), [availableLocales]);


return (
<div className="language-switcher">
<label htmlFor="language-select">{t('languageLabel', 'Language')}</label>
<select
id="language-select"
value={locale}
onChange={e => setLocale(e.target.value)}
>
{options.map(({ code, label }) => (
<option key={code} value={code}>{label}</option>
))}
</select>
</div>
);
}

