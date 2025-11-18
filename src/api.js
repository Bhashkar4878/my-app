const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';


async function request(path, opts = {}, { isFormData = false } = {}){
const token = localStorage.getItem('token');
const headers = opts.headers || {};
if(token) headers['Authorization'] = 'Bearer ' + token;
if(!isFormData) headers['Content-Type'] = 'application/json';
const res = await fetch(API_BASE + path, { ...opts, headers });
const text = await res.text();
let data = null;
try { data = text && JSON.parse(text); } catch(e){ data = text; }
if(!res.ok) throw { status: res.status, data };
return data;
}


export const auth = {
login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
register: (username, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
};


export const posts = {
 fetchAll: () => request('/posts'),
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
};

export const translate = {
 text: (text, targetLang) =>
   request('/translate', {
     method: 'POST',
     body: JSON.stringify({ text, targetLang }),
   }),
};


export default { auth, posts, messages, explore, profile, translate };
