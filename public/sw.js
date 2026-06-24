const CACHE_NAME = 'sitelog-cache-v1'
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/Sitelog-logo.svg',
]

// install: 프리캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// activate: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// fetch: Stale-While-Revalidate 및 Network-first 전략
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Chrome extensions, 외부 API, Firebase 서비스, POST/PUT 요청 등은 캐싱 제외
  if (
    request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseinstallations.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return
  }

  // Next.js 정적 파일 (_next/static), 로컬 정적 파일은 Stale-While-Revalidate 적용
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
     url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?|json)$/))
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          }).catch(() => {
            // 네트워크 에러는 무시
          })
          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // 페이지 HTML 요청: Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone())
            return networkResponse
          })
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/')
          })
        })
    )
  }
})
