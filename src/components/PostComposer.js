import React, { useState } from 'react';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';
import api from '../api';

const MAX_CHARACTERS = 1000;

export default function PostComposer({ onCreate }) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { t } = useTranslation();

  const remainingChars = MAX_CHARACTERS - text.length;
  const isOverLimit = text.length > MAX_CHARACTERS;

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || isOverLimit) return;
    await onCreate(text.trim(), imageFile);
    setText('');
    setImageFile(null);
    setImagePreview(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleTextChange(e) {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARACTERS) {
      setText(newText);
    }
  }

  // Get current user profile for avatar - will be loaded from API
  const [currentUserProfile, setCurrentUserProfile] = React.useState(null);
  
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await api.profile.me();
        setCurrentUserProfile(profile);
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }
    loadProfile();
  }, []);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const currentUser = localStorage.getItem('username') || 'User';
  const userInitial = currentUser[0]?.toUpperCase() || 'U';

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-header">
        <div 
          className="composer-avatar"
          style={{ 
            backgroundImage: currentUserProfile?.profilePicture 
              ? `url(${getImageUrl(currentUserProfile.profilePicture)})` 
              : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!currentUserProfile?.profilePicture && userInitial}
        </div>
        <textarea 
          value={text} 
          onChange={handleTextChange} 
          placeholder={t('composer.placeholder', "What's happening?")}
          maxLength={MAX_CHARACTERS}
        />
      </div>
      <div className="composer-meta">
        {remainingChars < 100 && (
          <span className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
            {remainingChars}
          </span>
        )}
      </div>
      {imagePreview && (
        <div className="composer-image-preview">
          <img src={imagePreview} alt="preview" loading="lazy" decoding="async" />
        </div>
      )}
      <div className="composer-controls">
        <label className="composer-upload">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </label>
        <button type="submit" disabled={isOverLimit || !text.trim()}>
          {t('composer.postButton')}
        </button>
      </div>
    </form>
  );
}
