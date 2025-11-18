const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';


async function request(path, opts = {}, { isFormData = false } = {}){
const token = localStorage.getItem('token');
const headers = opts.headers || {};
if(token) headers['Authorization'] = 'Bearer ' + token;
// Don't set Content-Type for FormData - browser will set it with boundary
const bodyIsFormData = opts.body instanceof FormData;
if(!isFormData && !bodyIsFormData) {
  headers['Content-Type'] = 'application/json';
}
// Remove Content-Type header if it's FormData to let browser set it
if(isFormData || bodyIsFormData) {
  delete headers['Content-Type'];
  console.log('Sending FormData request to:', API_BASE + path, {
    method: opts.method || 'GET',
    hasBody: !!opts.body,
    bodyType: opts.body?.constructor?.name,
    headers: Object.keys(headers)
  });
}
const res = await fetch(API_BASE + path, { ...opts, headers });
const text = await res.text();
let data = null;
try { data = text && JSON.parse(text); } catch(e){ data = text; }
if(!res.ok) {
  console.error('Request failed:', {
    status: res.status,
    path: API_BASE + path,
    response: data
  });
  throw { status: res.status, data };
}
return data;
}


export const auth = {
login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
register: (username, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
};


export const posts = {
 fetchPage: ({ cursor, limit } = {}) => {
  const params = new URLSearchParams();
  if(cursor) params.append('cursor', cursor);
  if(limit) params.append('limit', String(limit));
  const query = params.toString();
  return request(`/posts${query ? `?${query}` : ''}`);
 },
 create: (content, imageFile) => {
  if(imageFile){
   const form = new FormData();
   form.append('content', content);
   form.append('image', imageFile);
   return request('/posts', { method: 'POST', body: form }, { isFormData: true });
  }
  return request('/posts', { method: 'POST', body: JSON.stringify({ content }) });
 },
 like: (postId) => request(`/posts/${postId}/like`, { method: 'POST' }),
 comment: (postId, text) =>
   request(`/posts/${postId}/comment`, {
     method: 'POST',
     body: JSON.stringify({ text }),
   }),
};


export const messages = {
 listConversations: () => request('/messages/conversations'),
 fetchConversation: (conversationId) => request(`/messages/${conversationId}`),
 startConversation: (toUsername, text) =>
   request('/messages/start', {
     method: 'POST',
     body: JSON.stringify({ toUsername, text }),
   }),
 sendMessage: (conversationId, text) =>
   request(`/messages/${conversationId}`, {
     method: 'POST',
     body: JSON.stringify({ text }),
   }),
};

export const explore = {
 trending: () => request('/explore/trending'),
};

export const profile = {
 me: () => request('/profile/me'),
 suggestions: () => request('/profile/suggestions'),
 updateBio: (bio) =>
  request('/profile/bio', {
    method: 'PUT',
    body: JSON.stringify({ bio }),
  }),
 updateProfilePicture: (pictureFile) => {
   if (!pictureFile) {
     throw new Error('No file provided');
   }
   const form = new FormData();
   form.append('picture', pictureFile);
   console.log('FormData created for profile picture:', {
     hasFile: pictureFile instanceof File,
     fileName: pictureFile.name,
     fileType: pictureFile.type,
     fileSize: pictureFile.size
   });
   return request('/profile/picture', { method: 'POST', body: form }, { isFormData: true });
 },
 updateBanner: (bannerFile) => {
   if (!bannerFile) {
     throw new Error('No file provided');
   }
   const form = new FormData();
   form.append('banner', bannerFile);
   console.log('FormData created for banner:', {
     hasFile: bannerFile instanceof File,
     fileName: bannerFile.name,
     fileType: bannerFile.type,
     fileSize: bannerFile.size
   });
   return request('/profile/banner', { method: 'POST', body: form }, { isFormData: true });
 },
};

export const translate = {
 text: (text, targetLang) =>
   request('/translate', {
     method: 'POST',
     body: JSON.stringify({ text, targetLang }),
   }),
 batch: (texts, targetLang) =>
   request('/translate/batch', {
     method: 'POST',
     body: JSON.stringify({ texts, targetLang }),
   }),
};


export default { auth, posts, messages, explore, profile, translate };
