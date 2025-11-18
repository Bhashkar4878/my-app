import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import ExplorePage from './components/ExplorePage';
import MessagesPage from './components/MessagesPage';
import ProfilePage from './components/ProfilePage';
import RightSidebar from './components/RightSidebar';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './contexts/TranslationContext';
import './styles/app.css';


function App(){
const location = useLocation();
const token = localStorage.getItem('token');
const { t } = useTranslation();


return (
<div className="app-root">
<header className="topbar">
<h1 className="brand">{t('brand', 'X Clone')}</h1>
<nav>
{token ? (
<button onClick={() => { localStorage.removeItem('token'); window.location = '/login'; }}>{t('nav.logout')}</button>
) : (
<>
<Link to="/login">{t('nav.login')}</Link>
<Link to="/register">{t('nav.register')}</Link>
</>
)}
</nav>
</header>

<div className="layout">
<aside className="sidebar-left">
<nav className="sidebar-nav">
<Link to="/" className={location.pathname === '/' ? 'nav-item active' : 'nav-item'}>🏠 {t('nav.home')}</Link>
<Link to="/explore" className={location.pathname === '/explore' ? 'nav-item active' : 'nav-item'}>🔍 {t('nav.explore')}</Link>
<Link to="/notifications" className={location.pathname === '/notifications' ? 'nav-item active' : 'nav-item'}>🔔 {t('nav.notifications')}</Link>
<Link to="/messages" className={location.pathname === '/messages' ? 'nav-item active' : 'nav-item'}>✉️ {t('nav.messages')}</Link>
<Link to="/profile" className={location.pathname === '/profile' ? 'nav-item active' : 'nav-item'}>👤 {t('nav.profile')}</Link>
</nav>
<LanguageSwitcher />
</aside>

<main className="layout-center">
<Routes>
<Route path="/" element={token ? <Feed /> : <Navigate to="/login" />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/explore" element={token ? <ExplorePage /> : <Navigate to="/login" />} />
<Route path="/notifications" element={token ? <div className="placeholder-page">{t('notificationsPlaceholder')}</div> : <Navigate to="/login" />} />
<Route path="/messages" element={token ? <MessagesPage /> : <Navigate to="/login" />} />
<Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" />} />
</Routes>
</main>

<aside className="sidebar-right">
{token ? <RightSidebar /> : <div className="sidebar-card glass">{t('loginPrompt')}</div>}
</aside>
</div>
</div>
);
}


export default App;