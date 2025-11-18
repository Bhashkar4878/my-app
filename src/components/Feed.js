import React, { useEffect, useState } from 'react';
import api from '../api';
import PostComposer from './PostComposer';
import PostItem from './PostItem';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';


export default function Feed(){
const [posts, setPosts] = useState([]);
const [initialLoading, setInitialLoading] = useState(true);
const [loadingMore, setLoadingMore] = useState(false);
const [err, setErr] = useState('');
const [nextCursor, setNextCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);
const { t } = useTranslation();


async function loadInitial(){
setInitialLoading(true);
setErr('');
try{
const data = await api.posts.fetchPage();
const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
// Filter out hidden posts
const visiblePosts = (data.posts || []).filter(p => !hiddenPosts.includes(p.id));
setPosts(visiblePosts);
setNextCursor(data.nextCursor || null);
setHasMore(Boolean(data.hasMore));
}catch(e){
setErr(t('feed.errorLoad'));
}
setInitialLoading(false);
}

async function loadMore(){
if(loadingMore || !hasMore) return;
setLoadingMore(true);
try{
const data = await api.posts.fetchPage({ cursor: nextCursor });
const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
// Filter out hidden posts
const visiblePosts = (data.posts || []).filter(p => !hiddenPosts.includes(p.id));
setPosts(prev => [...prev, ...visiblePosts]);
setNextCursor(data.nextCursor || null);
setHasMore(Boolean(data.hasMore));
}catch(e){
setErr(t('feed.errorLoad'));
}
setLoadingMore(false);
}


useEffect(()=>{ loadInitial(); },[]);


async function handleCreate(content, imageFile){
try{
await api.posts.create(content, imageFile);
await loadInitial();
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
p.id === postId ? { 
  ...p, 
  comments: [...(p.comments || []), newComment],
  commentsCount: (p.commentsCount || 0) + 1
} : p
)
);
}catch(e){ setErr(t('feed.errorComment')); }
}

function handleHidePost(postId){
setPosts(prev => prev.filter(p => p.id !== postId));
}


return (
<div className="feed-root">
<PostComposer onCreate={handleCreate} />
{err && <div className="error">{err}</div>}
{initialLoading ? (
<div>{t('feed.loading')}</div>
) : (
<>
<div className="posts-list">
{posts.map(p => (
<PostItem
key={p.id}
post={p}
onLike={() => handleLike(p.id)}
onComment={(text) => handleComment(p.id, text)}
onHide={handleHidePost}
/>
))}
</div>
{hasMore && (
<div className="feed-load-more">
<button type="button" onClick={loadMore} disabled={loadingMore}>
{loadingMore ? t('feed.loading') : t('feed.loadMore')}
</button>
</div>
)}
</>
)}
</div>
);
}

