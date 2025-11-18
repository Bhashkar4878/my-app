import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';
import useContentTranslation from '../hooks/useContentTranslation';

function normalizeBio(value){
if(!value) return '';
const trimmed = value.trim();
if(trimmed === 'New to X' || trimmed === 'No bio yet.') return '';
return trimmed;
}

function ProfilePost({ post, username }) {
const { t } = useTranslation();
const translation = useContentTranslation(post.content);

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

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
<img 
  src={getImageUrl(post.imageUrl)} 
  alt="profile post" 
  className="post-image" 
  loading="lazy" 
  decoding="async"
  onError={(e) => {
    console.error('Post image failed to load:', post.imageUrl);
    e.target.style.display = 'none';
  }}
/>
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
const [editingBio, setEditingBio] = useState(false);
const [bioDraft, setBioDraft] = useState('');
const [bioStatus, setBioStatus] = useState('');
const [savingBio, setSavingBio] = useState(false);
const [profilePicture, setProfilePicture] = useState(null);
const [bannerImage, setBannerImage] = useState(null);
const [profilePicturePreview, setProfilePicturePreview] = useState(null);
const [bannerPreview, setBannerPreview] = useState(null);
const [uploadingPicture, setUploadingPicture] = useState(false);
const [uploadingBanner, setUploadingBanner] = useState(false);
const { t } = useTranslation();
const sanitizedBio = useMemo(() => normalizeBio(profile?.bio), [profile]);
const bioTranslation = useContentTranslation(sanitizedBio);


useEffect(() => {
let mounted = true;
async function load(){
setLoading(true);
setErr('');
try{
const data = await api.profile.me();
if(mounted){
setProfile(data);
setBioDraft(normalizeBio(data.bio));
}
}catch(e){
if(mounted) setErr(e.data?.message || 'Could not load profile');
}
setLoading(false);
}
load();
return () => { mounted = false; };
}, []);

useEffect(() => {
if(profile){
setBioDraft(normalizeBio(profile.bio));
// Set profile picture and banner from API response
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
console.log('Profile data received:', {
  profilePicture: profile.profilePicture,
  bannerImage: profile.bannerImage,
  API_BASE
});
if(profile.profilePicture){
const imageUrl = profile.profilePicture.startsWith('http') ? profile.profilePicture : `${API_BASE}${profile.profilePicture}`;
console.log('Setting profile picture URL:', imageUrl);
// Test if image loads
const img = new Image();
img.onload = () => {
  console.log('Profile picture loaded successfully');
  setProfilePicturePreview(imageUrl);
};
img.onerror = () => {
  console.error('Profile picture failed to load:', imageUrl);
  setProfilePicturePreview(null);
};
img.src = imageUrl;
} else {
console.log('No profile picture in profile data');
setProfilePicturePreview(null);
}
if(profile.bannerImage){
const imageUrl = profile.bannerImage.startsWith('http') ? profile.bannerImage : `${API_BASE}${profile.bannerImage}`;
console.log('Setting banner URL:', imageUrl);
// Test if image loads
const img = new Image();
img.onload = () => {
  console.log('Banner loaded successfully');
  setBannerPreview(imageUrl);
};
img.onerror = () => {
  console.error('Banner failed to load:', imageUrl);
  setBannerPreview(null);
};
img.src = imageUrl;
} else {
console.log('No banner in profile data');
setBannerPreview(null);
}
}
}, [profile]);

function toggleEdit(){
setBioStatus('');
setEditingBio((prev) => !prev);
// Don't reset previews when closing - keep saved images
}

async function handleProfilePictureChange(e){
const file = e.target.files?.[0];
if(!file) return;

// Validate file type
if(!file.type.startsWith('image/')){
alert('Please select an image file');
e.target.value = ''; // Reset input
return;
}

// Validate file size (max 5MB)
if(file.size > 5 * 1024 * 1024){
alert('Image size must be less than 5MB');
e.target.value = ''; // Reset input
return;
}

setProfilePicture(file);
// Show preview immediately
const reader = new FileReader();
reader.onloadend = () => {
  setProfilePicturePreview(reader.result);
};
reader.readAsDataURL(file);

// Upload to backend
setUploadingPicture(true);
try{
console.log('Uploading profile picture:', file.name, file.type, file.size);
const res = await api.profile.updateProfilePicture(file);
console.log('Upload response:', res);
if(!res || !res.profilePicture){
throw new Error('Invalid response from server');
}
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const imageUrl = res.profilePicture.startsWith('http') ? res.profilePicture : `${API_BASE}${res.profilePicture}`;
console.log('Setting profile picture URL:', imageUrl);
setProfilePicturePreview(imageUrl);
setProfile(prev => prev ? { ...prev, profilePicture: res.profilePicture } : prev);
// Force a reload of the profile to ensure everything is in sync
const updatedProfile = await api.profile.me();
setProfile(updatedProfile);
}catch(error){
console.error('Failed to upload profile picture:', error);
const errorMsg = error.data?.message || error.message || 'Failed to upload profile picture';
alert(`Error: ${errorMsg}`);
// Reset preview on error
if(profile?.profilePicture){
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
setProfilePicturePreview(profile.profilePicture.startsWith('http') ? profile.profilePicture : `${API_BASE}${profile.profilePicture}`);
} else {
setProfilePicturePreview(null);
}
}finally{
setUploadingPicture(false);
e.target.value = ''; // Reset input to allow selecting same file again
}
}

async function handleBannerChange(e){
const file = e.target.files?.[0];
if(!file) return;

// Validate file type
if(!file.type.startsWith('image/')){
alert('Please select an image file');
e.target.value = ''; // Reset input
return;
}

// Validate file size (max 5MB)
if(file.size > 5 * 1024 * 1024){
alert('Image size must be less than 5MB');
e.target.value = ''; // Reset input
return;
}

setBannerImage(file);
// Show preview immediately
const reader = new FileReader();
reader.onloadend = () => {
  setBannerPreview(reader.result);
};
reader.readAsDataURL(file);

// Upload to backend
setUploadingBanner(true);
try{
console.log('Uploading banner:', file.name, file.type, file.size);
const res = await api.profile.updateBanner(file);
console.log('Upload response:', res);
if(!res || !res.bannerImage){
throw new Error('Invalid response from server');
}
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
const imageUrl = res.bannerImage.startsWith('http') ? res.bannerImage : `${API_BASE}${res.bannerImage}`;
console.log('Setting banner URL:', imageUrl);
setBannerPreview(imageUrl);
setProfile(prev => prev ? { ...prev, bannerImage: res.bannerImage } : prev);
// Force a reload of the profile to ensure everything is in sync
const updatedProfile = await api.profile.me();
setProfile(updatedProfile);
}catch(error){
console.error('Failed to upload banner:', error);
const errorMsg = error.data?.message || error.message || 'Failed to upload banner';
alert(`Error: ${errorMsg}`);
// Reset preview on error
if(profile?.bannerImage){
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';
setBannerPreview(profile.bannerImage.startsWith('http') ? profile.bannerImage : `${API_BASE}${profile.bannerImage}`);
} else {
setBannerPreview(null);
}
}finally{
setUploadingBanner(false);
e.target.value = ''; // Reset input to allow selecting same file again
}
}

async function saveBio(e){
e.preventDefault();
if(savingBio) return;
setBioStatus('');
setSavingBio(true);
try{
const res = await api.profile.updateBio(bioDraft || '');
setProfile(prev => prev ? { ...prev, bio: res.bio } : prev);
// Images are already saved to localStorage when selected
setEditingBio(false);
setBioStatus(t('profile.bioSaveSuccess'));
}catch(error){
setBioStatus(error.data?.message || t('profile.bioSaveError'));
}finally{
setSavingBio(false);
}
}

const hasBio = Boolean(sanitizedBio);
const displayedBio = hasBio ? bioTranslation.text : t('profile.newUserBio');

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
<div className="profile-cover" style={{ backgroundImage: bannerPreview ? `url("${bannerPreview}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
{editingBio && (
<label className="profile-cover-upload" style={{ opacity: uploadingBanner ? 0.6 : 1, pointerEvents: uploadingBanner ? 'none' : 'auto' }}>
<input type="file" accept="image/*" onChange={handleBannerChange} disabled={uploadingBanner} />
<span>{uploadingBanner ? 'Uploading...' : 'Change banner'}</span>
</label>
)}
</div>
<div className="profile-header">
<div className="profile-avatar-wrapper">
<div className="profile-avatar" style={{ backgroundImage: profilePicturePreview ? `url("${profilePicturePreview}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
{!profilePicturePreview && profile.username[0]?.toUpperCase()}
</div>
{editingBio && (
<label className="profile-avatar-upload" style={{ opacity: uploadingPicture ? 0.6 : 1, pointerEvents: uploadingPicture ? 'none' : 'auto' }}>
<input type="file" accept="image/*" onChange={handleProfilePictureChange} disabled={uploadingPicture} />
<span>{uploadingPicture ? 'Uploading...' : 'Change'}</span>
</label>
)}
</div>
<div className="profile-actions">
<button type="button" onClick={toggleEdit}>
{editingBio ? t('profile.cancelEdit') : t('profile.edit')}
</button>
</div>
</div>

<div className="profile-info">
<h2>{profile.username}</h2>
{editingBio ? (
<form className="profile-bio-form" onSubmit={saveBio}>
<textarea
value={bioDraft}
onChange={e => setBioDraft(e.target.value)}
maxLength={160}
placeholder={t('profile.bioPlaceholder')}
/>
<div className="profile-bio-form-actions">
<button type="submit" disabled={savingBio}>
{savingBio ? t('profile.bioSaving') : t('profile.saveBio')}
</button>
<button type="button" onClick={toggleEdit}>
{t('profile.cancelEdit')}
</button>
</div>
{bioStatus && <div className="profile-bio-status">{bioStatus}</div>}
</form>
) : (
<>
<p className="profile-bio">{displayedBio}</p>
{hasBio && (
<div className="translate-row">
{bioTranslation.error && <span className="translate-error">{bioTranslation.error}</span>}
<button type="button" className="translate-btn" onClick={bioTranslation.toggle} disabled={bioTranslation.loading}>
{bioTranslation.loading
? t('translate.loading')
: bioTranslation.hasTranslation
? t('translate.showOriginal')
: t('translate.button')}
</button>
</div>
)}
</>
)}
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


