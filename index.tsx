
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Changed import path to be more explicit to avoid module resolution issues, although the root cause was App.tsx being a placeholder.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);