import React, { useEffect, useState } from 'react';
import api from '../api';
import PostComposer from './PostComposer';
import PostItem from './PostItem';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';


export default function Feed(){
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState('');
const { t } = useTranslation();


async function load(){
setLoading(true);
try{
const data = await api.posts.fetchAll();
setPosts(data);
}catch(e){ setErr(t('feed.errorLoad')); }
setLoading(false);
}


useEffect(()=>{ load(); },[]);


async function handleCreate(content, imageFile){
try{
await api.posts.create(content, imageFile);
await load();
}catch(e){ setErr(t('feed.errorCreate')); }
}

async function handleLike(postId){
try{
const { likesCount } = await api.posts.like(postId);
setPosts(prev =>
prev.map(p => p.id === postId ? { ...p, likesCount } : p)
);
}catch(e){ setErr(t('feed.errorLike')); }
}

async function handleComment(postId, text){
try{
const newComment = await api.posts.comment(postId, text);
setPosts(prev =>
prev.map(p =>
p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p
)
);
}catch(e){ setErr(t('feed.errorComment')); }
}


return (
<div className="feed-root">
<PostComposer onCreate={handleCreate} />
{err && <div className="error">{err}</div>}
{loading ? <div>{t('feed.loading')}</div> : (
<div className="posts-list">
{posts.map(p => (
<PostItem
key={p.id}
post={p}
onLike={() => handleLike(p.id)}
onComment={(text) => handleComment(p.id, text)}
/>
))}
</div>
)}
</div>
);
}