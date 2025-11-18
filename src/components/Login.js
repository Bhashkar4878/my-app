import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../styles/auth.css';
import { useTranslation } from '../contexts/TranslationContext';


export default function Login(){
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [err, setErr] = useState('');
const nav = useNavigate();
const { t } = useTranslation();


async function submit(e){
e.preventDefault();
setErr('');
try{
const res = await api.auth.login(username, password);
localStorage.setItem('token', res.token);
nav('/');
}catch(err){
setErr(err.data?.message || 'Login failed');
}
}


return (
<div className="auth-container">
<form onSubmit={submit} className="auth-form">
<h2>{t('auth.loginTitle')}</h2>
{err && <div className="error">{err}</div>}
<label>{t('auth.username')}</label>
<input value={username} onChange={e=>setUsername(e.target.value)} />
<label>{t('auth.password')}</label>
<input value={password} type="password" onChange={e=>setPassword(e.target.value)} />
<button type="submit">{t('auth.loginButton')}</button>
<p>{t('auth.linkRegister')} <Link to="/register">{t('nav.register')}</Link></p>
</form>
</div>
);
}