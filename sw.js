/* 아무것도 저장하지 않는다 — 설치가 되게 하려고 둘 뿐이다.
   나중에 오프라인을 붙일 때 이 파일만 채우면 된다. */
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',    () => {});
