import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/feed.css';
import { useTranslation } from '../contexts/TranslationContext';
import useContentTranslation from '../hooks/useContentTranslation';

function MessageBubble({ message }) {
const { t } = useTranslation();
const translation = useContentTranslation(message.text);


return (
<div className="message-bubble">
<div className="message-meta">{message.senderUsername}</div>
<div className="message-text">{translation.text}</div>
<div className="translate-row">
{translation.error && <span className="translate-error">{translation.error}</span>}
<button type="button" className="translate-btn" onClick={translation.toggle} disabled={translation.loading}>
{translation.loading ? t('translate.loading') : translation.hasTranslation ? t('translate.showOriginal') : t('translate.button')}
</button>
</div>
</div>
);
}


export default function MessagesPage(){
const [conversations, setConversations] = useState([]);
const [selectedId, setSelectedId] = useState(null);
const [messages, setMessages] = useState([]);
const [newText, setNewText] = useState('');
const [startTo, setStartTo] = useState('');
const [startText, setStartText] = useState('');
const [err, setErr] = useState('');
const { t } = useTranslation();


async function loadConversations(){
try{
const data = await api.messages.listConversations();
setConversations(data);
}catch(e){
setErr(t('feed.errorLoad'));
}
}


useEffect(() => {
loadConversations();
}, []);


async function openConversation(id){
setSelectedId(id);
setMessages([]);
setErr('');
try{
const data = await api.messages.fetchConversation(id);
setMessages(data);
}catch(e){
setErr(t('feed.errorLoad'));
}
}


async function sendMessage(e){
e.preventDefault();
if(!selectedId || !newText.trim()) return;
try{
const msg = await api.messages.sendMessage(selectedId, newText.trim());
setMessages(prev => [...prev, msg]);
setNewText('');
}catch(e){
setErr(t('feed.errorComment'));
}
}


async function startConversation(e){
e.preventDefault();
if(!startTo.trim() || !startText.trim()) return;
try{
const { conversationId, message } = await api.messages.startConversation(startTo.trim(), startText.trim());
setStartTo('');
setStartText('');
await loadConversations();
await openConversation(conversationId);
setMessages([message]);
}catch(e){
setErr(e.data?.message || t('feed.errorComment'));
}
}


return (
<div className="messages-page">
<div className="messages-sidebar">
<h3>{t('messages.title')}</h3>
<div className="messages-list">
{conversations.map(c => {
const other = c.participants.find(p => !p.isSelf);
const name = other ? other.username : 'Conversation';
return (
<button
key={c.id}
className={c.id === selectedId ? 'message-thread active' : 'message-thread'}
onClick={() => openConversation(c.id)}
>
<div className="thread-name">{name}</div>
{c.lastMessage && (
<div className="thread-last">{c.lastMessage.senderUsername}: {c.lastMessage.text}</div>
)}
</button>
);
})}
</div>

<form className="start-conversation-form" onSubmit={startConversation}>
<h4>{t('messages.startTitle')}</h4>
<input
placeholder={t('messages.to')}
value={startTo}
onChange={e => setStartTo(e.target.value)}
/>
<input
placeholder={t('messages.startText')}
value={startText}
onChange={e => setStartText(e.target.value)}
/>
<button type="submit">{t('messages.startButton')}</button>
</form>
</div>

<div className="messages-main">
{err && <div className="error">{err}</div>}
{!selectedId ? (
<div className="messages-empty">{t('messages.placeholderThread')}</div>
) : (
<>
<div className="messages-thread">
{messages.map(m => (
<MessageBubble key={m.id} message={m} />
))}
</div>
<form className="message-input-form" onSubmit={sendMessage}>
<input
placeholder={t('messages.newMessage')}
value={newText}
onChange={e => setNewText(e.target.value)}
/>
<button type="submit">{t('messages.send')}</button>
</form>
</>
)}
</div>
</div>
);
}


