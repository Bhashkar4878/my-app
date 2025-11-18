import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/app.css';
import { useTranslation } from '../contexts/TranslationContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

export default function RightSidebar(){
const [suggestions, setSuggestions] = useState([]);
const [trends, setTrends] = useState([]);
const [err, setErr] = useState('');
const { t } = useTranslation();


useEffect(() => {
let mounted = true;
async function load(){
if(!localStorage.getItem('token')) return;
try{
const [suggestionsRes, trendsRes] = await Promise.all([
api.profile.suggestions(),
api.explore.trending(),
]);
if(mounted){
setSuggestions(suggestionsRes);
setTrends(trendsRes);
}
}catch(e){
if(mounted) setErr('Could not load sidebar data');
}
}
load();
return () => { mounted = false; };
}, []);


return (
<div className="right-sidebar">
<div className="right-search">
<input placeholder={t('searchPlaceholder')} />
</div>
{err && <div className="error">{err}</div>}

<div className="sidebar-card glass">
<div className="sidebar-card-header">{t('suggestionsHeader')}</div>
{suggestions.length === 0 && <div className="empty-row">{t('noSuggestions')}</div>}
{suggestions.map(user => {
const trimmedBio = user.bio?.trim();
const fallbackBio = !trimmedBio || trimmedBio === 'New to X' || trimmedBio === 'No bio yet.'
? t('profile.newUserBio')
: trimmedBio;
return (
<div key={user.id} className="suggestion-row">
<div 
  className="suggestion-avatar"
  style={{
    backgroundImage: user.profilePicture 
      ? `url(${getImageUrl(user.profilePicture)})` 
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
  {!user.profilePicture && user.username[0]?.toUpperCase()}
</div>
<div className="suggestion-details">
<div className="suggestion-name">{user.username}</div>
<div className="suggestion-bio">{fallbackBio}</div>
</div>
<button type="button" className="follow-btn">{t('followButton')}</button>
</div>
);})}
</div>

<div className="sidebar-card glass">
<div className="sidebar-card-header">{t('trendsHeader')}</div>
{trends.length === 0 && <div className="empty-row">{t('explore.none')}</div>}
{trends.map(trend => (
<div key={trend.tag} className="trend-row">
<div className="trend-tag">#{trend.tag.replace(/^#/, '')}</div>
<div className="trend-count">{trend.count} posts</div>
</div>
))}
</div>

<div className="sidebar-card glass promo-card">
<h3>{t('promoTitle')}</h3>
<p>{t('promoText')}</p>
<button>{t('subscribe')}</button>
</div>
</div>
);
}


