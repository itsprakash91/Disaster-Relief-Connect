import React, { useState } from "react";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import toast from "react-hot-toast";

const MapControls = ({
  center,
  setCenter,
  radius,
  setRadius,
  map,
  onCalculateRoute,
  routeInfo,
  onClearRoute,
  routeLoading = false,
}) => {
  const { location, getLocation, loading: geoLoading } = useGeoLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [activeTab, setActiveTab] = useState("route");
  const [pendingLocationField, setPendingLocationField] = useState(null); // "origin" | "destination" | null

  const handleRecenter = async () => {
    if (location) {
      const newCenter = {
        lat: location.latitude || location.lat,
        lng: location.longitude || location.lng,
      };
      setCenter(newCenter);
      if (map) {
        map.panTo(newCenter);
        map.setZoom(15);
      }
      toast.success("Map recentered to your location!");
    } else {
      await getLocation();
      if (location) {
        const newCenter = {
          lat: location.latitude || location.lat,
          lng: location.longitude || location.lng,
        };
        setCenter(newCenter);
        if (map) {
          map.panTo(newCenter);
          map.setZoom(15);
        }
      }
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    if (!window.google || !window.google.maps) {
      toast.error("Google Maps not loaded");
      return;
    }

    if (!window.google.maps.Geocoder) {
      toast.error("Geocoding API is not enabled. Please enable it in Google Cloud Console.", {
        duration: 5000,
      });
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setCenter(newCenter);
        if (map) {
          map.panTo(newCenter);
          map.setZoom(15);
        }
        toast.success(`Found: ${results[0].formatted_address}`);
        setSearchQuery("");
      } else if (status === "REQUEST_DENIED" || status === "OVER_QUERY_LIMIT") {
        toast.error(
          "Geocoding API error. Please check your API key and enable Geocoding API in Google Cloud Console.",
          { duration: 6000 }
        );
      } else if (status === "ZERO_RESULTS") {
        toast.error("Location not found. Please try a different search term.");
      } else {
        toast.error(`Search failed: ${status}. Please try again.`);
      }
    });
  };

  const handleGetCurrentLocation = (field) => {
    if (location) {
      const address = `${location.latitude ?? location.lat}, ${location.longitude ?? location.lng}`;
      if (field === "origin") setOrigin(address);
      else setDestination(address);
      toast.success("Current location added!");
      return;
    }

    // `getLocation` is not a Promise; we wait for hook state to update.
    setPendingLocationField(field);
    getLocation();
  };

  // When geolocation arrives, fill whichever field requested it.
  React.useEffect(() => {
    if (!pendingLocationField) return;
    if (!location) return;

    const address = `${location.latitude ?? location.lat}, ${location.longitude ?? location.lng}`;
    if (pendingLocationField === "origin") setOrigin(address);
    else setDestination(address);

    toast.success("Current location added!");
    setPendingLocationField(null);
  }, [location, pendingLocationField]);

  const handleCalculateRoute = async () => {
    if (!origin.trim() || !destination.trim()) {
      toast.error("Please enter both origin and destination");
      return;
    }

    if (!window.google || !window.google.maps) {
      toast.error("Google Maps not loaded");
      return;
    }

    if (!onCalculateRoute) {
      toast.error("Route service not available");
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();

      const geocodeAddress = (address) => {
        return new Promise((resolve, reject) => {
          const coordMatch = address.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
          if (coordMatch) {
            resolve({
              lat: parseFloat(coordMatch[1]),
              lng: parseFloat(coordMatch[2]),
            });
            return;
          }

          geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results[0]) {
              const loc = results[0].geometry.location;
              resolve({
                lat: loc.lat(),
                lng: loc.lng(),
              });
            } else {
              reject(new Error(`Could not geocode: ${address}`));
            }
          });
        });
      };

      const originCoords = await geocodeAddress(origin);
      const destCoords = await geocodeAddress(destination);

      onCalculateRoute(
        `${originCoords.lat},${originCoords.lng}`,
        `${destCoords.lat},${destCoords.lng}`
      );
    } catch (error) {
      toast.error(error.message || "Failed to calculate route");
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-white shadow-2xl rounded-2xl border border-gray-200 w-96 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4">
        <h3 className="font-bold text-lg">🗺️ Map Controls</h3>
        <p className="text-xs text-blue-100 mt-1">Navigate and explore</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab("route")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === "route"
            ? "bg-white text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-blue-600"
            }`}
        >
          🛣️ Route
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${activeTab === "search"
            ? "bg-white text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-blue-600"
            }`}
        >
          🔍 Search
        </button>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Route Planning Tab */}
        {activeTab === "route" && (
          <div className="space-y-4">
            {/* Origin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 From (Origin)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !routeLoading && handleCalculateRoute()}
                  placeholder="Enter origin address or coordinates..."
                  className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={routeLoading}
                />
                <button
                  onClick={() => handleGetCurrentLocation("origin")}
                  disabled={routeLoading}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-lg transition-all font-semibold disabled:opacity-50"
                  title="Use current location"
                >
                  📍
                </button>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 To (Destination)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !routeLoading && handleCalculateRoute()}
                  placeholder="Enter destination address or coordinates..."
                  className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={routeLoading}
                />
                <button
                  onClick={() => handleGetCurrentLocation("destination")}
                  disabled={routeLoading}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-lg transition-all font-semibold disabled:opacity-50"
                  title="Use current location"
                >
                  📍
                </button>
              </div>
            </div>

            {/* Route Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCalculateRoute}
                disabled={routeLoading || !origin.trim() || !destination.trim()}
                className="flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {routeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>🗺️</span>
                    <span>Get Route</span>
                  </>
                )}
              </button>
              {routeInfo && (
                <button
                  onClick={onClearRoute}
                  disabled={routeLoading}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-3 rounded-lg transition-all shadow-lg disabled:opacity-50"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Route Info Card */}
            {routeInfo && (
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">✅</span>
                  <h4 className="font-bold text-green-800">Route Information</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">📏 Distance:</span>
                    <span className="text-green-700 font-bold">{routeInfo.distance}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">⏱️ Duration:</span>
                    <span className="text-green-700 font-bold">{routeInfo.duration}</span>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-xs text-gray-600 mb-1">
                      <strong>From:</strong> {routeInfo.startAddress}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>To:</strong> {routeInfo.endAddress}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-4">
            {/* Search Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter location name or address..."
                  className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all font-semibold shadow-lg"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Radius Control */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📊 Search Radius: <span className="text-blue-600">{radius / 1000} km</span>
              </label>
              <input
                type="range"
                min="1000"
                max="20000"
                step="1000"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>20 km</span>
              </div>
            </div>

            {/* Recenter Button */}
            <button
              onClick={handleRecenter}
              disabled={geoLoading}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {geoLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <span>📍</span>
                  <span>Recenter to My Location</span>
                </>
              )}
            </button>

            {/* Current Location Display */}
            {center && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-1">Current Center:</p>
                <p className="text-xs text-gray-700 font-mono">
                  {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapControls;
