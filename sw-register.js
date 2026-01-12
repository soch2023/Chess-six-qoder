/**
 * Service Worker 注册文件
 * 用于注册Service Worker以实现PWA离线功能
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('SW registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.log('SW registration failed:', error);
            });
    });
}