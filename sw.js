/* K書吧 Service Worker：讓頁面本身沒網路也打得開（書檔本來就存在 IndexedDB）。
   - 頁面（index.html）：有網路一律抓最新（跟 App 的做法一致），抓到就更新快取；抓不到或太久沒回應才用快取
   - marked、DOMPurify（cdnjs，網址帶版本號）與 Google Fonts：快取優先，第一次上網用到就存起來
   - api.github.com、帶 ?ver= 的頁面（檢查更新用）與其他請求：不經手，照常走網路 */
const VERSION = 'v1';
const SHELL = 'kbook-shell-' + VERSION;   // 頁面
const ASSETS = 'kbook-assets-' + VERSION; // 腳本與字型
const NET_TIMEOUT = 8000;

const PAGE = new URL('./', self.location).href;            // https://…/KBookBar/
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js'
];
// 網址帶 ?ver= 的是網頁的「檢查更新」在抓線上版本，不經手（不然網路慢時會拿快取裡的舊版回答）
const isPage = url => url.origin === self.location.origin && !url.searchParams.has('ver') && (url.pathname === new URL(PAGE).pathname || /\/index\.html$/.test(url.pathname));
const isAsset = url => LIBS.includes(url.href) || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    try { await shell.put(PAGE, await fetch(PAGE, { cache: 'no-cache' })); } catch {}
    const assets = await caches.open(ASSETS);
    await Promise.all(LIBS.map(u => assets.match(u).then(hit => hit || fetch(u).then(r => { if (r.ok) return assets.put(u, r); }).catch(() => {}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, ASSETS]);
    for (const k of await caches.keys()) if (k.startsWith('kbook-') && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch { return; }
  if (isPage(url)) e.respondWith(pageFirst());
  else if (isAsset(url)) e.respondWith(assetCached(req));
});

/* 頁面：網路優先，NET_TIMEOUT 內沒回來就先給快取，網路回來後仍寫進快取，下次打開就是新的 */
async function pageFirst() {
  const shell = await caches.open(SHELL);
  const net = fetch(PAGE, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) shell.put(PAGE, r.clone()).catch(() => {});
    return r;
  });
  net.catch(() => {}); // 超時後才失敗的網路請求，不要變成沒人接的 rejection
  const timeout = new Promise(res => setTimeout(() => res(null), NET_TIMEOUT));
  try {
    const r = await Promise.race([net, timeout]);
    if (r && r.ok) return r;
  } catch {}
  const hit = await shell.match(PAGE);
  if (hit) return hit;
  // 快取也沒有：把網路的結果（或錯誤）原樣交回去，瀏覽器／App 顯示自己的錯誤頁
  return net;
}

/* 腳本與字型：快取優先；沒有就抓，抓到存起來（字型 CSS 依瀏覽器給不同內容，帶 Vary，Cache API 會自己比對） */
async function assetCached(req) {
  const assets = await caches.open(ASSETS);
  const hit = await assets.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r && (r.ok || r.type === 'opaque')) assets.put(req, r.clone()).catch(() => {});
  return r;
}
