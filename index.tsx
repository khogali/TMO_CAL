import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        
        // This promise resolves when a service worker has successfully registered
        // and is in the 'activated' state, controlling the page.
        navigator.serviceWorker.ready.then(() => {
            
            // Check session storage to prevent showing the offline-ready message on every page load.
            if (!sessionStorage.getItem('offlineReadyMessageShown')) {
                 // Dispatch a custom event for the App component to listen to.
                 window.dispatchEvent(new CustomEvent('show-toast', { detail: 'App is ready for offline use.' }));
                 sessionStorage.setItem('offlineReadyMessageShown', 'true');
            }
        });

      }).catch(registrationError => {
        console.log('Service Worker registration failed: ', registrationError);
      });
  });
}