/**
 * IndexedDB Utility Module
 * Handles offline storage for help requests and other data
 */

// Keep DB name stable to avoid breaking existing offline data.
const DB_NAME = "DisasterReliefConnectDB";
const DB_VERSION = 1;

// Store names
export const STORE_NAMES = {
    HELP_REQUESTS: "helpRequests",
    SYNC_QUEUE: "syncQueue",
    CACHED_RESPONSES: "cachedResponses",
};

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initializeDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("❌ IndexedDB initialization failed:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log("✅ IndexedDB initialized successfully");
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log("📦 Creating IndexedDB stores...");

            // Help Requests Store - for offline submissions
            if (!db.objectStoreNames.contains(STORE_NAMES.HELP_REQUESTS)) {
                const helpRequestStore = db.createObjectStore(
                    STORE_NAMES.HELP_REQUESTS,
                    { keyPath: "id", autoIncrement: true }
                );
                helpRequestStore.createIndex("status", "status", { unique: false });
                helpRequestStore.createIndex("timestamp", "timestamp", { unique: false });
            }

            // Sync Queue - for tracking what needs to be synced
            if (!db.objectStoreNames.contains(STORE_NAMES.SYNC_QUEUE)) {
                const syncQueueStore = db.createObjectStore(
                    STORE_NAMES.SYNC_QUEUE,
                    { keyPath: "id", autoIncrement: true }
                );
                syncQueueStore.createIndex("type", "type", { unique: false });
                syncQueueStore.createIndex("status", "status", { unique: false });
                syncQueueStore.createIndex("createdAt", "createdAt", { unique: false });
            }

            // Cached Responses - for API response caching
            if (!db.objectStoreNames.contains(STORE_NAMES.CACHED_RESPONSES)) {
                const cachedStore = db.createObjectStore(
                    STORE_NAMES.CACHED_RESPONSES,
                    { keyPath: "url" }
                );
                cachedStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

/**
 * Store a help request offline
 */
export async function storeHelpRequestOffline(requestData) {
    try {
        if (!db) await initializeDB();

        const request = db
            .transaction(STORE_NAMES.HELP_REQUESTS, "readwrite")
            .objectStore(STORE_NAMES.HELP_REQUESTS)
            .add({
                ...requestData,
                status: "pending",
                timestamp: Date.now(),
                synced: false,
            });

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log("✅ Help request stored offline with ID:", request.result);
                resolve(request.result);
            };
            request.onerror = () => {
                console.error("❌ Failed to store help request:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error storing help request offline:", error);
        throw error;
    }
}

/**
 * Get all offline help requests pending sync
 */
export async function getOfflineHelpRequests() {
    try {
        if (!db) await initializeDB();

        const store = db
            .transaction(STORE_NAMES.HELP_REQUESTS, "readonly")
            .objectStore(STORE_NAMES.HELP_REQUESTS);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error retrieving offline help requests:", error);
        throw error;
    }
}

/**
 * Mark help request as synced
 */
export async function markHelpRequestSynced(id, serverId) {
    try {
        if (!db) await initializeDB();

        const transaction = db.transaction(STORE_NAMES.HELP_REQUESTS, "readwrite");
        const store = transaction.objectStore(STORE_NAMES.HELP_REQUESTS);

        const getRequest = store.get(id);

        return new Promise((resolve, reject) => {
            getRequest.onsuccess = () => {
                const request = getRequest.result;
                if (request) {
                    request.synced = true;
                    request.status = "synced";
                    request.serverId = serverId;
                    request.syncedAt = Date.now();

                    const updateRequest = store.put(request);
                    updateRequest.onsuccess = () => {
                        console.log(`✅ Help request ${id} marked as synced`);
                        resolve(request);
                    };
                    updateRequest.onerror = () => {
                        reject(updateRequest.error);
                    };
                }
            };
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    } catch (error) {
        console.error("Error marking help request as synced:", error);
        throw error;
    }
}

/**
 * Delete offline help request
 */
export async function deleteOfflineHelpRequest(id) {
    try {
        if (!db) await initializeDB();

        const request = db
            .transaction(STORE_NAMES.HELP_REQUESTS, "readwrite")
            .objectStore(STORE_NAMES.HELP_REQUESTS)
            .delete(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log(`✅ Help request ${id} deleted`);
                resolve();
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error deleting offline help request:", error);
        throw error;
    }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(type, data) {
    try {
        if (!db) await initializeDB();

        const request = db
            .transaction(STORE_NAMES.SYNC_QUEUE, "readwrite")
            .objectStore(STORE_NAMES.SYNC_QUEUE)
            .add({
                type,
                data,
                status: "pending",
                createdAt: Date.now(),
                retries: 0,
            });

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log("✅ Item added to sync queue:", request.result);
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error adding to sync queue:", error);
        throw error;
    }
}

/**
 * Get pending sync queue items
 */
export async function getSyncQueueItems(type = null) {
    try {
        if (!db) await initializeDB();

        const store = db
            .transaction(STORE_NAMES.SYNC_QUEUE, "readonly")
            .objectStore(STORE_NAMES.SYNC_QUEUE);

        return new Promise((resolve, reject) => {
            let request;
            if (type) {
                request = store.index("type").getAll(type);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                const items = request.result.filter((item) => item.status === "pending");
                resolve(items);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error retrieving sync queue items:", error);
        throw error;
    }
}

/**
 * Mark sync queue item as completed
 */
export async function markSyncQueueItemCompleted(id) {
    try {
        if (!db) await initializeDB();

        const transaction = db.transaction(STORE_NAMES.SYNC_QUEUE, "readwrite");
        const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE);

        const getRequest = store.get(id);

        return new Promise((resolve, reject) => {
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.status = "completed";
                    item.completedAt = Date.now();

                    const updateRequest = store.put(item);
                    updateRequest.onsuccess = () => {
                        resolve(item);
                    };
                    updateRequest.onerror = () => {
                        reject(updateRequest.error);
                    };
                }
            };
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    } catch (error) {
        console.error("Error marking sync queue item as completed:", error);
        throw error;
    }
}

/**
 * Delete sync queue item
 */
export async function deleteSyncQueueItem(id) {
    try {
        if (!db) await initializeDB();

        const request = db
            .transaction(STORE_NAMES.SYNC_QUEUE, "readwrite")
            .objectStore(STORE_NAMES.SYNC_QUEUE)
            .delete(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error deleting sync queue item:", error);
        throw error;
    }
}

/**
 * Cache API response
 */
export async function cacheAPIResponse(url, data) {
    try {
        if (!db) await initializeDB();

        const request = db
            .transaction(STORE_NAMES.CACHED_RESPONSES, "readwrite")
            .objectStore(STORE_NAMES.CACHED_RESPONSES)
            .put({
                url,
                data,
                timestamp: Date.now(),
            });

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error caching API response:", error);
        throw error;
    }
}

/**
 * Get cached API response
 */
export async function getCachedAPIResponse(url) {
    try {
        if (!db) await initializeDB();

        const store = db
            .transaction(STORE_NAMES.CACHED_RESPONSES, "readonly")
            .objectStore(STORE_NAMES.CACHED_RESPONSES);

        const request = store.get(url);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Error retrieving cached API response:", error);
        throw error;
    }
}

/**
 * Clear all data from IndexedDB (useful for logout)
 */
export async function clearAllData() {
    try {
        if (!db) await initializeDB();

        const transaction = db.transaction(
            [
                STORE_NAMES.HELP_REQUESTS,
                STORE_NAMES.SYNC_QUEUE,
                STORE_NAMES.CACHED_RESPONSES,
            ],
            "readwrite"
        );

        return new Promise((resolve, reject) => {
            const helpReqRequest = transaction
                .objectStore(STORE_NAMES.HELP_REQUESTS)
                .clear();
            const syncQueueRequest = transaction
                .objectStore(STORE_NAMES.SYNC_QUEUE)
                .clear();
            const cachedRequest = transaction
                .objectStore(STORE_NAMES.CACHED_RESPONSES)
                .clear();

            transaction.oncomplete = () => {
                console.log("✅ All IndexedDB data cleared");
                resolve();
            };

            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    } catch (error) {
        console.error("Error clearing IndexedDB:", error);
        throw error;
    }
}

export default {
    initializeDB,
    storeHelpRequestOffline,
    getOfflineHelpRequests,
    markHelpRequestSynced,
    deleteOfflineHelpRequest,
    addToSyncQueue,
    getSyncQueueItems,
    markSyncQueueItemCompleted,
    deleteSyncQueueItem,
    cacheAPIResponse,
    getCachedAPIResponse,
    clearAllData,
};
