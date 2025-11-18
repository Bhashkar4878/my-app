import React, { useEffect, useState, useRef } from 'react';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';
import useContentTranslation from '../hooks/useContentTranslation';
import PostMenu from './PostMenu';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const imageUrl = `${API_BASE}${url}`;
  console.log('Post image URL:', url, '->', imageUrl);
  return imageUrl;
};

const MAX_CHARACTERS = 1000;

export default function PostItem({ post, onLike, onComment, onHide }) {
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [revealPostContent, setRevealPostContent] = useState(!post.isFlagged);
  const [revealedComments, setRevealedComments] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const lastTapRef = useRef(0);
  const postRef = useRef(null);
  const { t } = useTranslation();
  const translation = useContentTranslation(post.content);

  const displayText = translation.text || '';
  const shouldTruncate = displayText.length > MAX_CHARACTERS;
  const truncatedText = shouldTruncate && !isExpanded 
    ? displayText.substring(0, MAX_CHARACTERS) 
    : displayText;

  // Sync likes count when post updates
  useEffect(() => {
    setLikesCount(post.likesCount || 0);
  }, [post.likesCount]);

  useEffect(() => {
    setRevealPostContent(!post.isFlagged);
  }, [post.id, post.isFlagged]);

  useEffect(() => {
    const initial = {};
    (post.comments || []).forEach((comment) => {
      initial[comment.id] = !comment.isFlagged;
    });
    setRevealedComments(initial);
  }, [post.comments]);

  function handleDoubleTap(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      handleLikeToggle();
    }
    lastTapRef.current = currentTime;
  }

  function handleLikeToggle() {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Optimistically update count
    if (newLikedState) {
      setLikesCount(prev => prev + 1);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 600);
    } else {
      setLikesCount(prev => Math.max(0, prev - 1));
    }
    
    // Call the parent handler which will update the backend
    onLike();
  }

  function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(commentText.trim());
    setCommentText('');
    setShowCommentInput(false);
  }

  function handleShare() {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.authorUsername}`,
        text: post.content.substring(0, 100),
        url: postUrl,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(postUrl);
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  }

  function revealComment(commentId) {
    setRevealedComments(prev => ({ ...prev, [commentId]: true }));
  }

  function renderCategoryLabel(category) {
    const label = category ? t(`moderation.categoryLabels.${category}`, '') : '';
    if (label && label !== `moderation.categoryLabels.${category}`) {
      return label;
    }
    return t('moderation.categoryLabels.unknown');
  }

  function renderCommentContent(comment) {
    const isHidden = comment.isFlagged && !revealedComments[comment.id];
    if (!isHidden) {
      return <span className="post-comment-text">{comment.text}</span>;
    }
    return (
      <div className="comment-warning">
        <p>{t('moderation.commentWarning')}</p>
        {Array.isArray(comment.moderationCategories) && comment.moderationCategories.length > 0 && (
          <ul className="moderation-category-list">
            {comment.moderationCategories.map((c) => (
              <li key={c.detail}>{renderCategoryLabel(c.category)}</li>
            ))}
          </ul>
        )}
        <button type="button" className="comment-warning-btn" onClick={() => revealComment(comment.id)}>
          {t('moderation.commentRevealButton')}
        </button>
      </div>
    );
  }

  const getActionIcon = (type) => {
    const iconSize = 18.75;
    switch (type) {
      case 'comment':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case 'repost':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        );
      case 'like':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        );
      case 'share':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="post-item" 
      onDoubleClick={handleDoubleTap}
      ref={postRef}
    >
      {showHeartAnimation && (
        <div className="heart-animation">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
      )}
      <div className="post-meta">
        <div className="post-meta-left">
          <div 
            className="post-avatar"
            style={{
              backgroundImage: post.authorProfilePicture 
                ? `url(${getImageUrl(post.authorProfilePicture)})` 
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!post.authorProfilePicture && post.authorUsername[0]?.toUpperCase()}
          </div>
          <div className="post-author-info">
            <strong>{post.authorUsername}</strong>
            <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <PostMenu 
          post={post}
          onSave={(postId) => {
            const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
            if (!saved.includes(postId)) {
              localStorage.setItem('savedPosts', JSON.stringify([...saved, postId]));
            } else {
              localStorage.setItem('savedPosts', JSON.stringify(saved.filter(id => id !== postId)));
            }
          }}
          onHide={(postId) => {
            const hidden = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
            if (!hidden.includes(postId)) {
              localStorage.setItem('hiddenPosts', JSON.stringify([...hidden, postId]));
              // Notify parent to remove this post from feed
              onHide && onHide(postId);
            }
          }}
          onCopyLink={() => {}}
          onFollow={(username) => {
            // Follow functionality
          }}
        />
      </div>
      {post.isFlagged && !revealPostContent && (
        <div className="post-flag-warning">
          <strong>{t('moderation.warningTitle')}</strong>
          <p>{t('moderation.warningDescription')}</p>
          {Array.isArray(post.moderationCategories) && post.moderationCategories.length > 0 && (
            <div className="moderation-categories">
              <span>{t('moderation.categoriesLabel')}</span>
              <ul className="moderation-category-list">
                {post.moderationCategories.map((cat) => (
                  <li key={cat.detail}>{renderCategoryLabel(cat.category)}</li>
                ))}
              </ul>
            </div>
          )}
          <button type="button" className="post-flag-button" onClick={() => setRevealPostContent(true)}>
            {t('moderation.revealButton')}
          </button>
        </div>
      )}
      <div className={`post-flagged-shell ${post.isFlagged && !revealPostContent ? 'blurred' : ''}`}>
        <div className="post-body">
          {truncatedText}
          {shouldTruncate && (
            <button 
              type="button" 
              className="read-more-btn" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        <div className="translate-row">
          {translation.error && <span className="translate-error">{translation.error}</span>}
          <button type="button" className="translate-btn" onClick={translation.toggle} disabled={translation.loading}>
            {translation.loading ? t('translate.loading') : translation.hasTranslation ? t('translate.showOriginal') : t('translate.button')}
          </button>
        </div>
        {post.imageUrl && (
          <div className="post-image-wrapper">
            <img 
              src={getImageUrl(post.imageUrl)} 
              alt="post attachment" 
              className="post-image" 
              loading="lazy" 
              decoding="async" 
              onError={(e) => {
                console.error('Post image failed to load:', post.imageUrl, '->', getImageUrl(post.imageUrl));
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Post image loaded successfully:', post.imageUrl);
              }}
            />
          </div>
        )}
      </div>
      <div className="post-actions">
        <button 
          type="button" 
          className="post-action" 
          onClick={() => setShowCommentInput(!showCommentInput)}
        >
          {getActionIcon('comment')}
          <span>{post.commentsCount || 0}</span>
        </button>
        <button 
          type="button" 
          className="post-action"
          onClick={() => {
            // Repost functionality - placeholder for now
            alert('Repost functionality coming soon!');
          }}
        >
          {getActionIcon('repost')}
          <span>0</span>
        </button>
        <button 
          type="button" 
          className={`post-action ${isLiked ? 'liked' : ''}`}
          onClick={handleLikeToggle}
        >
          {getActionIcon('like')}
          <span>{likesCount}</span>
        </button>
        <button 
          type="button" 
          className="post-action"
          onClick={handleShare}
        >
          {getActionIcon('share')}
        </button>
      </div>
      {showCommentInput && (
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <input
            type="text"
            className="comment-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="comment-submit" disabled={!commentText.trim()}>
            Post
          </button>
        </form>
      )}
      {post.comments && post.comments.length > 0 && (
        <div className="post-comments">
          {post.comments.map(c => (
            <div key={c.id} className={`post-comment ${c.isFlagged ? 'flagged-comment' : ''}`}>
              <div 
                className="post-comment-avatar"
                style={{
                  backgroundImage: c.authorProfilePicture 
                    ? `url(${getImageUrl(c.authorProfilePicture)})` 
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!c.authorProfilePicture && c.authorUsername[0]?.toUpperCase()}
              </div>
              <div className="post-comment-content">
                <span className="post-comment-author">{c.authorUsername}</span>
                {renderCommentContent(c)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
