/**
 * Ziffi Chess Service Worker
 * 实现PWA离线功能和缓存策略
 */

const CACHE_NAME = 'ziffi-chess-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/chess-engine.js',
    '/js/game-controller.js',
    '/js/main.js',
    '/sw-register.js',
    '/manifest.json',
    '/favicon.ico'
];

// 安装事件 - 缓存资源
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('缓存已打开');
                return cache.addAll(urlsToCache);
            })
    );
});

// 拦截请求并提供缓存版本
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // 如果找到缓存版本，直接返回
                if (response) {
                    return response;
                }

                // 否则进行网络请求
                return fetch(event.request).then(
                    function(response) {
                        // 检查是否收到有效响应
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 克隆响应以进行缓存
                        var responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});