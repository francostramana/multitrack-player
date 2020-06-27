"use strict"

const filesToCache = [
  '/',
  'css/style.css',
  'css/tailwind-1.4.6.min.css',
  'components/dropzone.component.js',
  'components/track-player.component.js',
  'js/waveform.js',
  'js/worker.js',
  'app.js',
  'index.html',
];

const staticCacheName = 'cache-v1';

self.addEventListener('install', (event) => {
  //console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName)
    .then(cache => {
      return cache.addAll(filesToCache);
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  //console.log('👷', 'activate', event);
  return self.clients.claim();
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

      // TODO 4 - Add fetched files to the cache

    }).catch(error => {

      // TODO 6 - Respond with custom offline page

    })
  );
});