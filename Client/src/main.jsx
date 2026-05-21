import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { RequestsProvider } from "./contexts/RequestContext";
import { ChatProvider } from "./contexts/ChatContext";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { initializeDB } from "./utils/db";
import { setupNetworkListeners, requestNotificationPermission } from "./utils/offlineSync";
import { createHelpRequest } from "./api/helpRequests";

// Register Service Worker for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("✅ Service Worker registered successfully:", registration);

      // Handle service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available, show update prompt
            console.log("🔄 New version available");
            // You can trigger an update UI here
          }
        });
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  });

  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener("message", async (event) => {
    console.log("📨 Message from Service Worker:", event.data);

    if (event.data.type === "SYNC_OFFLINE_DATA") {
      console.log("🔄 Syncing offline data...");
      // Trigger sync - this would typically be handled by a global sync manager
      // that listens to this event
    }

    if (event.data.type === "PERIODIC_SYNC") {
      console.log("⏱️ Periodic sync check");
    }
  });
}

// Initialize IndexedDB and Offline functionality
(async () => {
  try {
    // Initialize database
    await initializeDB();
    console.log("✅ Database initialized");

    // Request notification permission
    await requestNotificationPermission();

    // Setup network listeners for offline sync
    setupNetworkListeners(createHelpRequest);
    console.log("✅ Offline sync listeners initialized");
  } catch (error) {
    console.error("❌ Error initializing offline functionality:", error);
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RequestsProvider>
        <ChatProvider>
          <BrowserRouter>
            <App />
            <Toaster position="top-right" />
          </BrowserRouter>
        </ChatProvider>
      </RequestsProvider>
    </AuthProvider>
  </React.StrictMode>
);
