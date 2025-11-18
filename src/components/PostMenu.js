import React, { useState, useRef, useEffect } from 'react';
import '../styles/feed.css';

export default function PostMenu({ post, onSave, onHide, onCopyLink, onFollow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    // Check if post is saved
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    setIsSaved(saved.includes(post.id));
  }, [post.id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  function handleSave() {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    setShowSaveAnimation(true);
    setTimeout(() => setShowSaveAnimation(false), 600);
    onSave && onSave(post.id);
    setIsOpen(false);
  }

  function handleHide() {
    onHide && onHide(post.id);
    setIsOpen(false);
  }

  function handleCopyLink() {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('Link copied to clipboard!');
    });
    onCopyLink && onCopyLink(post.id);
    setIsOpen(false);
  }

  function handleFollow() {
    onFollow && onFollow(post.authorUsername);
    setIsOpen(false);
  }

  return (
    <div className="post-menu-container" ref={menuRef}>
      <button
        type="button"
        className="post-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="12" cy="5" r="1"></circle>
          <circle cx="12" cy="19" r="1"></circle>
        </svg>
      </button>
      {isOpen && (
        <div className="post-menu-dropdown">
          <button 
            type="button" 
            className={`post-menu-item ${isSaved ? 'saved' : ''}`}
            onClick={handleSave}
          >
            {showSaveAnimation && (
              <div className="save-animation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            )}
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill={isSaved ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
          <button type="button" className="post-menu-item" onClick={handleHide}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <span>Not interested</span>
          </button>
          <button type="button" className="post-menu-item" onClick={handleCopyLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Copy link</span>
          </button>
          <button type="button" className="post-menu-item" onClick={handleFollow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>Follow @{post.authorUsername}</span>
          </button>
        </div>
      )}
    </div>
  );
}
