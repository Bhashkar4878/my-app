import React, { useState } from 'react';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';
import useContentTranslation from '../hooks/useContentTranslation';


export default function PostItem({ post, onLike, onComment }){
const [commentText, setCommentText] = useState('');
const { t } = useTranslation();
const translation = useContentTranslation(post.content);


function submitComment(e){
e.preventDefault();
if(!commentText.trim()) return;
onComment(commentText.trim());
setCommentText('');
}


return (
<div className="post-item">
<div className="post-meta">
<strong>{post.authorUsername}</strong>
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
<img src={post.imageUrl} alt="post attachment" className="post-image" />
</div>
)}
<div className="post-actions">
<button type="button" className="post-action" onClick={onLike}>
❤️ {post.likesCount || 0}
</button>
</div>
{post.comments && post.comments.length > 0 && (
<div className="post-comments">
{post.comments.map(c => (
<div key={c.id} className="post-comment">
<span className="post-comment-author">{c.authorUsername}</span>
<span className="post-comment-text">{c.text}</span>
</div>
))}
</div>
)}
<form className="comment-form" onSubmit={submitComment}>
<input
className="comment-input"
placeholder={t('commentPlaceholder')}
value={commentText}
onChange={e => setCommentText(e.target.value)}
/>
<button type="submit" className="comment-submit">{t('replyButton')}</button>
</form>
</div>
);
}