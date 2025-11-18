import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import '../styles/app.css';

export default function LanguageSwitcher(){
const { locale, setLocale, availableLocales, t } = useTranslation();


return (
<div className="language-switcher">
<label htmlFor="language-select">{t('languageLabel', 'Language')}</label>
<select
id="language-select"
value={locale}
onChange={e => setLocale(e.target.value)}
>
{availableLocales.map(code => (
<option key={code} value={code}>{code.toUpperCase()}</option>
))}
</select>
</div>
);
}

