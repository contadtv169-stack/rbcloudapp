const C='rbapp-v1',U=['/rbcloudapp/','/rbcloudapp/index.html','/rbcloudapp/styles.css','/rbcloudapp/app.js','/rbcloudapp/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(U)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))))});
self.addEventListener('fetch',e=>{if(e.request.url.startsWith('chrome-extension'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})