/**
 * Offline Sync Utilities
 * Handles syncing offline data when internet is restored
 */

import {
    getOfflineHelpRequests,
    markHelpRequestSynced,
    deleteOfflineHelpRequest,
    getSyncQueueItems,
    markSyncQueueItemCompleted,
    deleteSyncQueueItem,
} from "./db";

// Track sync status
let isSyncing = false;
let syncCallbacks = [];

/**
 * Check if the application is online
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Register a callback to be called when sync completes
 */
export function onSyncComplete(callback) {
    syncCallbacks.push(callback);
}

/**
 * Notify all listeners when sync completes
 */
function notifySyncComplete(results) {
    syncCallbacks.forEach((callback) => {
        try {
            callback(results);
        } catch (error) {
            console.error("Error in sync callback:", error);
        }
    });
}

/**
 * Sync offline help requests with the server
 */
export async function syncOfflineHelpRequests(apiCreateFunction) {
    if (isSyncing) {
        console.log("⏳ Sync already in progress");
        return;
    }

    if (isOnline() === false) {
        console.log("📴 Still offline, will sync when internet is available");
        return;
    }

    isSyncing = true;
    const results = {
        successful: [],
        failed: [],
        total: 0,
    };

    try {
        const offlineRequests = await getOfflineHelpRequests();
        const pendingRequests = offlineRequests.filter((r) => !r.synced);

        if (pendingRequests.length === 0) {
            console.log("✅ No offline requests to sync");
            isSyncing = false;
            return results;
        }

        console.log(`🔄 Starting sync of ${pendingRequests.length} offline requests...`);
        results.total = pendingRequests.length;

        for (const request of pendingRequests) {
            try {
                console.log(`📤 Syncing request ID ${request.id}:`, request);

                // Call the API function to submit the request
                const response = await apiCreateFunction(request);

                if (response && response.success) {
                    // Mark as synced in IndexedDB
                    await markHelpRequestSynced(request.id, response.data?.id);
                    results.successful.push({
                        localId: request.id,
                        serverId: response.data?.id,
                        status: "synced",
                    });
                    console.log(`✅ Request ${request.id} synced successfully`);
                } else {
                    throw new Error(response?.message || "Unknown error");
                }
            } catch (error) {
                console.error(`❌ Failed to sync request ${request.id}:`, error.message);
                results.failed.push({
                    localId: request.id,
                    error: error.message,
                    status: "failed",
                });
            }
        }

        // Log sync results
        console.log("🎯 Sync completed:", {
            total: results.total,
            successful: results.successful.length,
            failed: results.failed.length,
        });

        notifySyncComplete(results);
    } catch (error) {
        console.error("Error during offline sync:", error);
        results.error = error.message;
    } finally {
        isSyncing = false;
    }

    return results;
}

/**
 * Setup online/offline listeners
 */
export function setupNetworkListeners(apiCreateFunction) {
    window.addEventListener("online", async () => {
        console.log("🌐 Internet connection restored!");

        // Show notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Connection Restored", {
                body: "Syncing your offline requests...",
                icon: "/vite.svg",
            });
        }

        // Start sync after a small delay to ensure connection is stable
        setTimeout(async () => {
            const results = await syncOfflineHelpRequests(apiCreateFunction);

            if (results.successful.length > 0) {
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Sync Complete", {
                        body: `${results.successful.length} request(s) synced successfully!`,
                        icon: "/vite.svg",
                    });
                }
            }
        }, 1000);
    });

    window.addEventListener("offline", () => {
        console.log("📴 Internet connection lost!");
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Offline Mode", {
                body: "You are offline. Requests will be saved locally.",
                icon: "/vite.svg",
            });
        }
    });
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        try {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return false;
        }
    }

    return false;
}

/**
 * Show offline status notification
 */
export function showOfflineNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Working Offline", {
            body: "Your request is being saved locally. It will sync when you're back online.",
            icon: "/vite.svg",
            tag: "offline-mode",
        });
    }
}

/**
 * Get sync status
 */
export function getSyncStatus() {
    return {
        isSyncing,
        isOnline: isOnline(),
    };
}

export default {
    isOnline,
    onSyncComplete,
    syncOfflineHelpRequests,
    setupNetworkListeners,
    requestNotificationPermission,
    showOfflineNotification,
    getSyncStatus,
};
