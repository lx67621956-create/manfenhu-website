const CACHE='elf-v1';
const URLS=['/elf/student.html','/elf/student.css','/elf/student.js'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(URLS)}));
  self.skipWaiting()
});
self.addEventListener('activate',function(e){
  e.waitUntil(clients.claim())
});
self.addEventListener('fetch',function(e){
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r||fetch(e.request).catch(function(){return new Response('Offline',{status:503})})
    })
  )
});
