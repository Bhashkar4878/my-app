import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';
import useContentTranslation from '../hooks/useContentTranslation';

function ProfilePost({ post, username }) {
const { t } = useTranslation();
const translation = useContentTranslation(post.content);


return (
<div className="post-item">
<div className="post-meta">
<strong>{username}</strong>
<span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
</div>
<div className="post-body">{translation.text}</div>
<div className="translate-row">
{translation.error && <span className="translate-error">{translation.error}</span>}
<button type="button" className="translate-btn" onClick={translation.toggle} disabled={translation.loading}>
{translation.loading ? t('translate.loading') : translation.hasTranslation ? t('translate.showOriginal') : t('translate.button')}
</button>
</div>
{post.imageUrl && (
<div className="post-image-wrapper">
<img src={post.imageUrl} alt="profile post" className="post-image" />
</div>
)}
<div className="post-actions">
<span className="post-action">❤️ {post.likesCount}</span>
<span className="post-action">💬 {post.commentsCount}</span>
</div>
</div>
);
}


export default function ProfilePage(){
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState('');
const { t } = useTranslation();


useEffect(() => {
let mounted = true;
async function load(){
setLoading(true);
setErr('');
try{
const data = await api.profile.me();
if(mounted) setProfile(data);
}catch(e){
if(mounted) setErr(e.data?.message || 'Could not load profile');
}
setLoading(false);
}
load();
return () => { mounted = false; };
}, []);


if(loading){
return <div className="profile-page">{t('feed.loading')}</div>;
}

if(err){
return <div className="profile-page error">{err}</div>;
}

if(!profile){
return null;
}


return (
<div className="profile-page">
<div className="profile-cover" />
<div className="profile-header">
<div className="profile-avatar">
{profile.username[0]?.toUpperCase()}
</div>
<div className="profile-actions">
<button>{t('profile.edit')}</button>
</div>
</div>

<div className="profile-info">
<h2>{profile.username}</h2>
<p className="profile-bio">{profile.bio}</p>
<div className="profile-meta">
<span>📍 {profile.location}</span>
<span>🔗 {profile.website}</span>
<span>📅 {new Date(profile.joinedAt).toLocaleDateString()}</span>
</div>
<div className="profile-stats">
<span><strong>{profile.stats.posts}</strong> {t('profile.posts')}</span>
<span><strong>{profile.stats.followers}</strong> {t('profile.followers')}</span>
<span><strong>{profile.stats.following}</strong> {t('profile.following')}</span>
<span><strong>{profile.stats.likesReceived}</strong> {t('profile.likes')}</span>
</div>
</div>

<div className="profile-posts">
{profile.posts.length === 0 ? (
<div className="profile-empty">{t('profile.empty')}</div>
) : (
profile.posts.map(post => (
<ProfilePost key={post.id} post={post} username={profile.username} />
))
)}
</div>
</div>
);
}


