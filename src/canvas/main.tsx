/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Entry Point
 * Location: src/canvas/main.tsx
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '../popup/styles/popup.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
