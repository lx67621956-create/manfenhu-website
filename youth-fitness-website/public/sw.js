const CACHE='elf-v2';
const URLS=['/elf/student.html','/elf/student.css','/elf/student.js','/elf/index.html','/elf/manifest.json','/images/ui/pokeball.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(URLS)}));
  self.skipWaiting()
});
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))
    })
  );
  e.waitUntil(clients.claim())
});
self.addEventListener('fetch',function(e){
  e.respondWith(
    fetch(e.request).catch(function(){
      return caches.match(e.request).then(function(r){
        return r||new Response('Offline',{status:503})
      })
    })
  )
});
