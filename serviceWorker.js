const CACHE_NAME = 'weather-app-v1'
const urlsToCache = ['index.html', 'offline.html']

const self = this

// install service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Cache opened !')
            return cache.addAll(urlsToCache)
        })
    )
})

// listen for requests
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            console.log(event.request, cachedResponse)
            if(cachedResponse){
                return cachedResponse
            }

            return fetch(event.request).catch(() => caches.match("offline.html"))
        })
    )
})

// activate sw
self.addEventListener("activate", (event) => {
    const cacheWhiteList = []
    cacheWhiteList.push(CACHE_NAME)

    console.log(`caches `, caches)
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            console.log(cacheNames)
            Promise.all(
                cacheNames.map((cacheName) => {
                    if(!cacheWhiteList.includes(cacheName)) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})