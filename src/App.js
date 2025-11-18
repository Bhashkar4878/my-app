import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import ExplorePage from './components/ExplorePage';
import MessagesPage from './components/MessagesPage';
import ProfilePage from './components/ProfilePage';
import SavedPostsPage from './components/SavedPostsPage';
import RightSidebar from './components/RightSidebar';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggle from './components/ThemeToggle';
import SidebarNav from './components/SidebarNav';
import { useTranslation } from './contexts/TranslationContext';
import { useTheme } from './contexts/ThemeContext';
import './styles/app.css';


function App(){
const token = localStorage.getItem('token');
const { t } = useTranslation();
const { theme } = useTheme();


return (
<div className="app-root">
      <header className="topbar">
        <div className="brand">
          <img 
            src={theme === 'light' ? '/Black.png' : '/White.png'} 
            alt="Next" 
            className="brand-logo" 
          />
        </div>
        <nav className="topbar-nav">
{token && <ThemeToggle />}
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
<SidebarNav />
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
<Route path="/saved" element={token ? <SavedPostsPage /> : <Navigate to="/login" />} />
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