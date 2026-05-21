import React, { useState, useEffect } from "react";
import { createHelpRequest } from "../../api/helpRequests";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import { isOnline, showOfflineNotification } from "../../utils/offlineSync";
import { storeHelpRequestOffline, initializeDB } from "../../utils/db";

const HelpRequestForm = ({ onSuccess }) => {
  const { location, getLocation, error, loading: geoLoading } = useGeoLocation();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    category: "",
    description: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isOffline, setIsOffline] = useState(!isOnline());

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // If user goes offline, clear any "location required" message.
  useEffect(() => {
    if (!isOffline) return;
    setMessage((prev) =>
      prev === "Please allow location access first." ? "" : prev
    );
  }, [isOffline]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Location should be mandatory only when user is online.
    // In offline mode we still allow submissions (saved locally) even without location.
    if (!location && !isOffline) {
      setMessage("Please allow location access first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Convert category to backend format (lowercase, match enum values)
      const categoryMap = {
        "Food": "food",
        "Medical": "medical",
        "Rescue": "rescue",
        "Shelter": "shelter",
        "Other": "other"
      };

      const payload = {
        typeOfHelp: categoryMap[formData.category] || formData.category.toLowerCase(),
        description: formData.description,
        contact: formData.contact,
        location: {
          // When offline and location isn't available, keep coordinates null (still store request).
          coordinates: location
            ? [location.longitude ?? location.lng, location.latitude ?? location.lat] // [longitude, latitude] as per GeoJSON
            : undefined,
          address: formData.address || "", // address from form input
        },
      };

      console.log("📤 Sending payload:", JSON.stringify(payload, null, 2));

      // Check if offline (use state; navigator.onLine can be unreliable)
      if (isOffline) {
        // Save offline
        console.log("📴 Offline mode - saving request locally");
        await initializeDB();
        const id = await storeHelpRequestOffline(payload);
        setMessage(
          `✅ Request saved offline (ID: ${id}). It will sync automatically when internet is available.`
        );
        showOfflineNotification();
        setFormData({ name: "", contact: "", category: "", description: "", address: "" });
        // Call onSuccess callback if provided (to close modal)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000); // Close after 2 seconds
        }
      } else {
        // Submit online
        if (!location) {
          setMessage("Please allow location access first.");
          return;
        }
        const response = await createHelpRequest(payload);
        if (response && response.success) {
          setMessage("✅ Help request created successfully!");
          setFormData({ name: "", contact: "", category: "", description: "", address: "" });
          // Call onSuccess callback if provided (to close modal)
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 1500); // Close after 1.5 seconds
          }
        } else {
          throw new Error(response?.message || "Failed to create request");
        }
      }
    } catch (error) {
      console.error("Error creating help request:", error);

      // If network error while online, offer to save offline
      if (
        isOffline ||
        error.message.includes("Network") ||
        error.message.includes("offline")
      ) {
        setMessage(
          "❌ Network error! Your request has been saved offline and will sync when internet is available."
        );
        try {
          await initializeDB();
          const payload = {
            typeOfHelp: formData.category.toLowerCase(),
            description: formData.description,
            contact: formData.contact,
            address: formData.address || "",
            location: lat && lng
              ? {
                type: "Point",
                coordinates: [lng, lat]
              }
              : undefined
          };
          await storeHelpRequestOffline(payload);
          setFormData({ name: "", contact: "", category: "", description: "", address: "" });
        } catch (storageError) {
          console.error("Failed to save offline:", storageError);
        }
      } else {
        setMessage(
          `❌ ${error.response?.data?.message || error.message || "Failed to create help request. Try again."}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-xl p-6 border border-gray-200">
      {!onSuccess && (
        <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
          Create a Help Request
        </h2>
      )}

      {/* Offline Status Indicator */}
      {isOffline && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 font-semibold">📴 Offline Mode</p>
          <p className="text-sm text-yellow-700">Your request will be saved locally and synced when internet is available.</p>
        </div>
      )}

      {message && (
        <p className="text-center mb-3 text-sm text-gray-700">{message}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="tel"
          name="contact"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={handleChange}
          required
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Type of Help Needed</option>
          <option value="food">Food</option>
          <option value="water">Water</option>
          <option value="medical">Medical</option>
          <option value="shelter">Shelter</option>
          <option value="rescue">Rescue</option>
          <option value="other">Other</option>
        </select>

        <textarea
          name="description"
          placeholder="Describe the situation..."
          value={formData.description}
          onChange={handleChange}
          rows="4"
          required
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        <input
          type="text"
          name="address"
          placeholder="Address (Optional)"
          value={formData.address}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Location Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={getLocation}
              disabled={geoLoading || isOffline}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {geoLoading ? "📍 Getting Location..." : isOffline ? "📍 Location (optional offline)" : "📍 Get Location"}
            </button>

            {location && (
              <span className="text-sm text-green-700">
                Lat: {(location.latitude || location.lat)?.toFixed(3) || "N/A"} | Lng: {(location.longitude || location.lng)?.toFixed(3) || "N/A"}
              </span>
            )}
          </div>
          {!isOffline && !location && (
            <p className="text-xs text-gray-600">
              Location is <span className="font-semibold">required</span> when online.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              ⚠️ {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition-all disabled:opacity-50"
        >
          {loading ? "Submitting..." : isOffline ? "Save Offline" : "Submit Request"}
        </button>
      </form>
    </div>
  );
};


export default HelpRequestForm;
