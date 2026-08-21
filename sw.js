const CACHE = "locspot-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(SHELL).catch(function(){ return null; });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE) return caches.delete(k);
        return null;
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  const url = new URL(event.request.url);

  // Nunca cachear peticiones a Spotify: siempre deben ir a la red.
  if (url.hostname.indexOf("spotify.com") !== -1 ||
      url.hostname.indexOf("scdn.co") !== -1 ||
      url.hostname.indexOf("spotifycdn.com") !== -1){
    return;
  }

  if (event.request.method !== "GET") return;

  // La app: red primero, cache como respaldo si no hay conexión.
  event.respondWith(
    fetch(event.request).then(function(res){
      const copy = res.clone();
      caches.open(CACHE).then(function(cache){
        cache.put(event.request, copy).catch(function(){});
      });
      return res;
    }).catch(function(){
      return caches.match(event.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
