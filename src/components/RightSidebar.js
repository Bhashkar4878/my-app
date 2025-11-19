import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/app.css';
import { useTranslation } from '../contexts/TranslationContext';
import { useNavigate } from 'react-router-dom';

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
const navigate = useNavigate();


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
<div
  key={user.id}
  className="suggestion-row"
  onClick={() => navigate(`/profile/${encodeURIComponent(user.username)}`)}
  style={{ cursor: 'pointer' }}
>
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
  <button
    type="button"
    className="follow-btn"
    onClick={async (e) => {
      e.stopPropagation();
      try {
        // optimistic UI
        setSuggestions(prev => prev.map(s => s.id === user.id ? { ...s, isFollowing: !s.isFollowing } : s));
        await api.profile.follow(user.id);
      } catch (err) {
        // revert on error
        setSuggestions(prev => prev.map(s => s.id === user.id ? { ...s, isFollowing: !s.isFollowing } : s));
        console.error('Follow action failed', err);
        alert('Could not update follow state');
      }
    }}
  >
    {user.isFollowing ? t('followingButton') : t('followButton')}
  </button>
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


