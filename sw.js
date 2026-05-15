const C='rb-v1',U=['/rbcloud/','/rbcloud/index.html','/rbcloud/styles.css','/rbcloud/app.js','/rbcloud/manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(U)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))))});
self.addEventListener('fetch',e=>{if(e.request.url.startsWith('chrome-extension'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})