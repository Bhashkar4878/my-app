import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';


export default function ExplorePage(){
const [trending, setTrending] = useState([]);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState('');
const { t } = useTranslation();

useEffect(() => { ... }, [t]);
useEffect(() => {
let mounted = true;
async function load(){
setLoading(true);
setErr('');
try{
const data = await api.explore.trending();
if(mounted) setTrending(data);
}catch(e){
if(mounted) setErr(t('feed.errorLoad'));
}
setLoading(false);
}
load();
return () => { mounted = false; };
}, []);


return (
<div className="explore-page">
<h2>{t('explore.title')}</h2>
{err && <div className="error">{err}</div>}
{loading ? (
<div>{t('feed.loading')}</div>
) : (
<div className="trends-list">
{trending.length === 0 && <div className="trend-item">{t('explore.none')}</div>}
{trending.map(t => (
<div key={t.tag} className="trend-item">
<div className="trend-tag">#{t.tag.replace(/^#/, '')}</div>
<div className="trend-count">{t.count} posts</div>
</div>
))}
</div>
)}
</div>
);
}


