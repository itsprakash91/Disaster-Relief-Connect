/**
 * Service Worker for Disaster Relief Connect
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = "disaster-relief-v2";
const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/vite.svg",
    "/manifest.json",
];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
    console.log("🔧 Service Worker installing...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("📦 Caching essential assets");
            return cache.addAll(STATIC_ASSETS).catch((error) => {
                console.warn("Some assets failed to cache:", error);
                // Continue even if some assets fail to cache
            });
        })
    );
    // Activate immediately without waiting for other clients
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
    console.log("🚀 Service Worker activating...");
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("🗑️ Deleting old cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Claim all clients immediately
    self.clients.claim();
});

// Fetch event - prefer fresh app/API assets, fallback to cache when offline
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests and certain types
    if (url.origin !== location.origin) {
        return;
    }

    // Handle API requests differently (network-first)
    if (url.pathname.startsWith("/api/") || request.method !== "GET") {
        return event.respondWith(networkFirst(request));
    }

    // For app assets, prefer fresh files so auth changes are not stuck behind stale JS.
    event.respondWith(networkFirst(request));
});

/**
 * Network-first strategy: try network, fallback to cache
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);

        // Cache successful API responses for offline use
        if (response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error("❌ Network request failed:", request.url, error);

        // Try to return cached version
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        if (cached) {
            console.log("⚠️ Returning cached response for:", request.url);
            return cached;
        }

        // Return offline error response
        return new Response(
            JSON.stringify({
                error: "Offline",
                message:
                    "You are offline. Please check your internet connection.",
                cached: false,
            }),
            {
                status: 503,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

// Handle messages from clients
self.addEventListener("message", (event) => {
    console.log("📨 Service Worker received message:", event.data);

    if (event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }

    if (event.data.type === "CLEAR_CACHE") {
        caches.delete(CACHE_NAME).then(() => {
            console.log("🗑️ Cache cleared");
            event.ports[0].postMessage({ success: true });
        });
    }

    if (event.data.type === "GET_CACHE_SIZE") {
        caches.open(CACHE_NAME).then((cache) => {
            cache.keys().then((requests) => {
                event.ports[0].postMessage({ size: requests.length });
            });
        });
    }
});

// Background sync event - sync offline data when connection is restored
self.addEventListener("sync", (event) => {
    console.log("🔄 Background sync triggered:", event.tag);

    if (event.tag === "sync-offline-requests") {
        event.waitUntil(
            // Send message to all clients to trigger sync
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: "SYNC_OFFLINE_DATA",
                        message: "Connection restored, syncing offline data...",
                    });
                });
            })
        );
    }
});

// Periodic sync (if supported by browser)
self.addEventListener("periodicsync", (event) => {
    console.log("⏱️ Periodic sync triggered:", event.tag);

    if (event.tag === "sync-offline-requests-periodic") {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: "PERIODIC_SYNC",
                        message: "Periodic sync check...",
                    });
                });
            })
        );
    }
});

console.log("✅ Service Worker initialized");
