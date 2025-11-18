import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/app.css';
import { TranslationProvider } from './contexts/TranslationContext';


const container = document.getElementById('root');
const root = createRoot(container);
root.render(
<TranslationProvider>
<BrowserRouter>
<App />
</BrowserRouter>
</TranslationProvider>
);