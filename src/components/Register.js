import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';
import { useTranslation } from '../contexts/TranslationContext';


export default function Register(){
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [err, setErr] = useState('');
const nav = useNavigate();
const { t } = useTranslation();


async function submit(e){
e.preventDefault();
setErr('');
try{
await api.auth.register(username, password);
nav('/login');
}catch(error){
setErr(error.data?.message || 'Register failed');
}
}


return (
<div className="auth-container">
<form onSubmit={submit} className="auth-form">
<h2>{t('auth.registerTitle')}</h2>
{err && <div className="error">{err}</div>}
<label>{t('auth.username')}</label>
<input value={username} onChange={e=>setUsername(e.target.value)} />
<label>{t('auth.password')}</label>
<input value={password} type="password" onChange={e=>setPassword(e.target.value)} />
<button type="submit">{t('auth.registerButton')}</button>
</form>
</div>
);
}