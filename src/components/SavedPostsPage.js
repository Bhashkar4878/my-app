import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PostItem from './PostItem';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';

export default function SavedPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSavedPosts() {
      setLoading(true);
      setErr('');
      try {
        const savedIds = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        if (savedIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Fetch all posts and filter saved ones
        const data = await api.posts.fetchPage({ limit: 100 });
        const savedPosts = (data.posts || []).filter(p => savedIds.includes(p.id));
        setPosts(savedPosts);
      } catch (e) {
        setErr('Could not load saved posts');
      }
      setLoading(false);
    }
    loadSavedPosts();
  }, []);

  async function handleLike(postId) {
    try {
      const { likesCount } = await api.posts.like(postId);
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, likesCount } : p)
      );
    } catch (e) {
      setErr('Could not like post');
    }
  }

  async function handleComment(postId, text) {
    try {
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
    } catch (e) {
      setErr('Could not add comment');
    }
  }

  if (loading) {
    return <div className="feed-root"><div>{t('feed.loading')}</div></div>;
  }

  return (
    <div className="feed-root">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Saved Posts</h2>
      </div>
      {err && <div className="error">{err}</div>}
      {posts.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No saved posts yet. Save posts to view them here.</p>
        </div>
      ) : (
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

