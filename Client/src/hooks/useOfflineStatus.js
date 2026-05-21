/**
 * Offline Status Hook
 * Provides online/offline status and pending requests count
 */

import { useEffect, useState, useCallback } from "react";
import { getOfflineHelpRequests } from "../utils/db";
import { isOnline, setupNetworkListeners } from "../utils/offlineSync";

export function useOfflineStatus() {
    const [status, setStatus] = useState({
        isOnline: isOnline(),
        pendingRequests: 0,
        offlineRequests: [],
    });

    const updatePendingCount = useCallback(async () => {
        try {
            const requests = await getOfflineHelpRequests();
            const pendingRequests = requests.filter((r) => !r.synced);
            setStatus((prev) => ({
                ...prev,
                pendingRequests: pendingRequests.length,
                offlineRequests: pendingRequests,
            }));
        } catch (error) {
            console.error("Error updating pending requests count:", error);
        }
    }, []);

    useEffect(() => {
        // Initial check
        updatePendingCount();

        // Update on visibility change
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                updatePendingCount();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Update on online/offline
        const handleOnline = () => {
            setStatus((prev) => ({ ...prev, isOnline: true }));
            updatePendingCount();
        };

        const handleOffline = () => {
            setStatus((prev) => ({ ...prev, isOnline: false }));
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [updatePendingCount]);

    return {
        ...status,
        refetch: updatePendingCount,
    };
}

export default useOfflineStatus;
