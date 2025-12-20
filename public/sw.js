// Service Worker for LooLook PWA
const CACHE_NAME = 'loolook-v1';
const STATIC_CACHE = [
  '/',
  '/offline.html',
];

const API_CACHE = 'loolook-api-v1';
const MAP_CACHE = 'loolook-map-v1';

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE && cacheName !== MAP_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청 - 네트워크 우선, 캐시 폴백
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공적인 응답을 캐시에 저장
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 가져오기
          return caches.match(request);
        })
    );
    return;
  }

  // 카카오 지도 리소스 - 캐시 우선
  if (url.hostname.includes('kakao')) {
    event.respondWith(
      caches.open(MAP_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          return cached || fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // 기타 요청 - 네트워크 우선
  event.respondWith(
    fetch(request)
      .catch(() => {
        // 오프라인 시 캐시된 페이지 반환
        return caches.match(request).then((cached) => {
          return cached || caches.match('/offline.html');
        });
      })
  );
});
