// sw.js

// Import Workbox from its CDN for easier caching strategies
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Ensure the new service worker activates immediately upon installation
workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Destructure used Workbox modules for cleaner code
const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheable_response;
const { ExpirationPlugin } = workbox.expiration;

// Cache the main HTML page with a NetworkFirst strategy.
// This ensures users get the latest version if online, with an offline fallback.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
  })
);

// Cache the core app shell assets (JS, icons, manifest) using StaleWhileRevalidate.
// This provides an instant response from the cache while updating it in the background.
registerRoute(
  ({ request, url }) =>
    request.destination === 'script' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json'),
  new StaleWhileRevalidate({
    cacheName: 'static-assets-cache',
  })
);

// Cache Google Fonts for consistent offline typography.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 Days
    ],
  })
);

// Cache third-party CDN scripts using CacheFirst since they are versioned and immutable.
registerRoute(
  ({ url }) =>
    url.origin === 'https://cdn.tailwindcss.com' ||
    url.origin.includes('aistudiocdn.com') ||
    url.origin.includes('gstatic.com'),
  new CacheFirst({
    cacheName: 'cdn-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        purgeOnQuotaError: true, // Automatically clear if storage is low
      }),
    ],
  })
);
