/**
 * Fairytale IdeaPiece - Service Worker
 *
 * 이 스크립트는 Vercel(경로 prefix 없음)과 GitHub Pages(basePath '/ideaPiece' prefix 있음)
 * 양쪽 환경에서 동일 파일 그대로 동작해야 하므로, 자신이 서비스되는 경로 prefix를
 * self.location.pathname 기준으로 스스로 계산해서 사용한다 (하드코딩 금지).
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `ideapiece-cache-${CACHE_VERSION}`;

// sw.js는 항상 서빙 스코프의 루트에 위치시키므로,
// 자기 자신의 경로에서 '/sw.js'를 제거하면 base prefix(예: '/ideaPiece' 또는 '')를 얻을 수 있다.
const SCOPE_PREFIX = self.location.pathname.replace(/\/sw\.js$/, '');

function withPrefix(pathname) {
  if (!pathname.startsWith('/')) return pathname;
  return `${SCOPE_PREFIX}${pathname}`;
}

// 최초 설치 시 미리 캐시해둘 핵심 정적 자산 (모두 prefix 기준 경로로 계산)
const PRECACHE_URLS = [
  withPrefix('/manifest.json'),
  withPrefix('/icons/icon.svg'),
  withPrefix('/offline.html'),
].map((url) => new Request(url, { cache: 'reload' }));

// 이 경로들은 절대 캐시하지 않는다 (LLM 스토리 생성 API 등 동적 응답)
const NEVER_CACHE_PATTERNS = [/\/api\//];

function isNeverCacheable(pathname) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

// 정적 자산 판별 (확장자 기준)
const STATIC_ASSET_EXTENSIONS = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|mjs|woff2?|ttf|json)$/i;

function isStaticAsset(pathname) {
  if (pathname.endsWith('manifest.json')) return true;
  return STATIC_ASSET_EXTENSIONS.test(pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // 프리캐시 실패는 치명적이지 않으므로 설치 자체는 계속 진행한다.
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('ideapiece-cache-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function buildOfflineResponse() {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>오프라인 - Fairytale IdeaPiece</title>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fef9e7;
    color: #2f855a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    text-align: center;
    padding: 24px;
  }
  main { max-width: 420px; }
  h1 { font-size: 1.4rem; margin-bottom: 12px; }
  p { font-size: 1rem; line-height: 1.5; }
</style>
</head>
<body>
  <main>
    <h1>지금은 인터넷 연결이 필요해요</h1>
    <p>네트워크가 끊긴 것 같아요. 연결이 다시 되면 페이지를 새로고침해 주세요.</p>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 1) 요청된 페이지 자체가 캐시되어 있으면 그것을 반환한다.
    const cached = await caches.match(request);
    if (cached) return cached;

    // 2) 전용 오프라인 페이지가 캐시되어 있으면 그것을 반환한다.
    const offlinePage = await caches.match(withPrefix('/offline.html'));
    if (offlinePage) return offlinePage;

    // 3) 그마저 실패하면 최후 안전장치로 인라인 HTML을 생성해 반환한다.
    return buildOfflineResponse();
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 정적 자산 요청이 실패하고 캐시도 없으면 그대로 에러를 전파한다.
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 요청만 처리하고, 그 외(POST 등)는 네트워크로 그대로 패스한다.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 다른 오리진 요청은 관여하지 않는다.
  if (url.origin !== self.location.origin) return;

  // /api/ 관련 요청(LLM 스토리 생성 등)은 절대 캐시하지 않고 네트워크로만 처리한다.
  if (isNeverCacheable(url.pathname)) return;

  // HTML 네비게이션 요청: network-first, 실패 시 캐시 폴백, 그마저 없으면 인라인 오프라인 안내.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // 정적 자산: cache-first.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }

  // 그 외 요청은 서비스워커가 관여하지 않고 브라우저 기본 동작에 맡긴다.
});
