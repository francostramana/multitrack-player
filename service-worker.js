"use strict"

const filesToCache = [
  '/',
  'css/style.css',
  'https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css',
  'components/dropzone.component.js',
  'components/track-player.component.js',
  'js/waveform.js',
  'js/worker.js',
  'app.js',
  'index.html',
];

const staticCacheName = 'cache-v2';

self.addEventListener('install', (event) => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName)
    .then(cache => {
      return cache.addAll(filesToCache);
    })
  );

  // to avoid waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {

  // Delete outdated caches
  const cacheWhitelist = [staticCacheName];

  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );

});

self.addEventListener('fetch', event => {
  //console.log('Fetch event for ', event.request.url);
  event.respondWith(
    caches.match(event.request)
    .then(response => {
      if (response) {
        console.log('Found ', event.request.url, ' in cache');
        return response;
      }
      console.log('Network request for ', event.request.url);
      return fetch(event.request)

      // TODO - Add fetched files to the cache

    }).catch(error => {
      console.log(e);
    })
  );
});
