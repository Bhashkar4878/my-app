import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/app.css';
import { TranslationProvider } from './contexts/TranslationContext';
import { ThemeProvider } from './contexts/ThemeContext';


const container = document.getElementById('root');
const root = createRoot(container);
root.render(
<ThemeProvider>
<TranslationProvider>
<BrowserRouter>
<App />
</BrowserRouter>
</TranslationProvider>
</ThemeProvider>
);