import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { getNearbyRequests } from "../../api/helpRequests";
import MapControls from "./MapControls";
import RequestMarker from "./RequestMarker";
import toast from "react-hot-toast";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const libraries = ["places", "geometry", "routes"];

// Route polyline styling
const routePolylineOptions = {
  strokeColor: "#2563EB",
  strokeOpacity: 0.8,
  strokeWeight: 5,
  fillColor: "#2563EB",
  fillOpacity: 0.1,
};

const originMarkerIcon = {
  path: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 3c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7m0 2c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5",
  fillColor: "#10B981",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
  scale: 1.2,
};

const destinationMarkerIcon = {
  path: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m0 3c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7m0 2c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5",
  fillColor: "#EF4444",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
  scale: 1.2,
};

const MapView = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [radius, setRadius] = useState(5000);
  const [requests, setRequests] = useState([]);
  const [map, setMap] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapsLoadError, setMapsLoadError] = useState(null);

  // Route state
  const [routePath, setRoutePath] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const apiKey = import.meta.env.VITE_MAP_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: "disaster-relief-google-maps",
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  // Catch Google Maps auth failures (invalid/expired key, billing, referrer restrictions).
  useEffect(() => {
    if (!apiKey) return;
    const prev = window.gm_authFailure;
    window.gm_authFailure = () => {
      setMapsLoadError(
        "Google Maps authentication failed. Check API key validity, billing, enabled APIs, and HTTP referrer restrictions."
      );
    };
    return () => {
      window.gm_authFailure = prev ?? undefined;
    };
  }, [apiKey]);

  // Fetch nearby requests
  useEffect(() => {
    if (!apiKey) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getNearbyRequests(center.lat, center.lng, radius);

        const validRequests = data.filter((request) => {
          let lat, lng;
          if (request.location?.coordinates) {
            [lng, lat] = request.location.coordinates;
          } else if (request.latitude && request.longitude) {
            lat = request.latitude;
            lng = request.longitude;
          }
          return lat && lng && !isNaN(lat) && !isNaN(lng);
        });

        setRequests(validRequests);
      } catch (error) {
        console.error("Error loading nearby requests", error);
        toast.error("Failed to load nearby requests");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [center, radius, apiKey]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    window.setTimeout(() => {
      if (window.google?.maps?.event) {
        window.google.maps.event.trigger(mapInstance, "resize");
      }
      mapInstance.panTo(center);
    }, 100);
  }, [center]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate route between origin and destination
  const calculateRoute = useCallback(
    async (origin, destination) => {
      if (!map) {
        toast.error("Map not ready");
        return;
      }

      if (!origin || !destination) {
        toast.error("Please provide both origin and destination");
        return;
      }

      setRouteLoading(true);

      try {
        // Parse coordinates if they're in "lat,lng" format
        const parseCoords = (coord) => {
          if (typeof coord === "string") {
            const [lat, lng] = coord.split(",").map((x) => parseFloat(x.trim()));
            return { lat, lng };
          }
          return coord;
        };

        const originLocation = parseCoords(origin);
        const destinationLocation = parseCoords(destination);

        if (
          !originLocation?.lat ||
          !originLocation?.lng ||
          !destinationLocation?.lat ||
          !destinationLocation?.lng
        ) {
          throw new Error("Invalid coordinates format");
        }

        // Store coordinates for marker display
        setOriginCoords(originLocation);
        setDestinationCoords(destinationLocation);

        if (!window.google?.maps?.DirectionsService) {
          throw new Error("Directions API not available. Please ensure Maps JavaScript API is loaded.");
        }

        const directionsService = new window.google.maps.DirectionsService();
        const result = await directionsService.route({
          origin: originLocation,
          destination: destinationLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        const route = result?.routes?.[0];
        const leg = route?.legs?.[0];

        if (!route || !leg) {
          toast.error("No route found between these locations");
          setRoutePath(null);
          setRouteInfo(null);
          return;
        }

        // Draw route as polyline (overview_path is already decoded)
        if (route.overview_path?.length) {
          setRoutePath(route.overview_path);
        } else {
          setRoutePath(null);
        }

        // Fit map to route bounds
        if (route.bounds) {
          map.fitBounds(route.bounds);
        }

        setRouteInfo({
          distance: leg.distance?.text ?? "N/A",
          duration: leg.duration?.text ?? "N/A",
          startAddress: leg.start_address ?? "Start Location",
          endAddress: leg.end_address ?? "Destination",
        });

        toast.success(
          `Route found! Distance: ${leg.distance?.text ?? "N/A"}, Duration: ${leg.duration?.text ?? "N/A"}`
        );
      } catch (error) {
        console.error("Route calculation error:", error);
        toast.error(`Route error: ${error.message}`);
        setRoutePath(null);
        setRouteInfo(null);
      } finally {
        setRouteLoading(false);
      }
    },
    [map]
  );

  // Clear route
  const handleClearRoute = useCallback(() => {
    setRoutePath(null);
    setRouteInfo(null);
    setOriginCoords(null);
    setDestinationCoords(null);
    toast.success("Route cleared");
  }, []);

  const handleMapClick = () => setSelectedRequest(null);

  const handleMarkerClick = (request) => setSelectedRequest(request);

  if (!apiKey) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-red-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-2xl border-2 border-red-200">
          <p className="text-red-600 font-bold text-2xl mb-2">⚠️ Google Maps API Key Missing</p>
          <p className="text-gray-600 text-sm">VITE_MAP_KEY is not configured</p>
        </div>
      </div>
    );
  }

  if (loadError || mapsLoadError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-red-200 p-6">
          <p className="text-red-600 font-bold text-xl mb-2">Map failed to load</p>
          <p className="text-gray-700 text-sm">
            {mapsLoadError ||
              "Failed to load Google Maps. Check API key, billing, enabled APIs, and referrer restrictions."}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white px-5 py-3 rounded-lg shadow text-gray-700 font-semibold">
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="relative">
        {/* Full-screen map */}
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={10}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          }}
        >
          {/* Route Polyline */}
          {routePath && routePath.length > 0 && (
            <Polyline path={routePath} options={routePolylineOptions} />
          )}

          {/* Origin Marker */}
          {originCoords && (
            <Marker
              position={originCoords}
              icon={originMarkerIcon}
              title="Origin Location"
              label={{
                text: "A",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            />
          )}

          {/* Destination Marker */}
          {destinationCoords && (
            <Marker
              position={destinationCoords}
              icon={destinationMarkerIcon}
              title="Destination Location"
              label={{
                text: "B",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            />
          )}

          {/* Help Request Markers */}
          {requests.map((request) => {
            let lat, lng;
            if (request.location?.coordinates) {
              [lng, lat] = request.location.coordinates;
            } else if (request.latitude && request.longitude) {
              lat = request.latitude;
              lng = request.longitude;
            }
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

            return (
              <RequestMarker
                key={request._id}
                position={{ lat, lng }}
                request={request}
                onClick={() => handleMarkerClick(request)}
              />
            );
          })}

          {/* Selected Request Info Window */}
          {selectedRequest && (() => {
            let lat, lng;
            if (selectedRequest.location?.coordinates) {
              [lng, lat] = selectedRequest.location.coordinates;
            } else {
              lat = selectedRequest.latitude;
              lng = selectedRequest.longitude;
            }
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

            return (
              <InfoWindow
                position={{ lat, lng }}
                onCloseClick={() => setSelectedRequest(null)}
              >
                <div className="p-3 max-w-xs">
                  <h4 className="font-bold text-blue-700 text-sm mb-1">
                    {selectedRequest.typeOfHelp?.toUpperCase() ||
                      selectedRequest.category?.toUpperCase() ||
                      "Help Request"}
                  </h4>
                  <p className="text-gray-700 text-xs mb-2 line-clamp-2">
                    {selectedRequest.description}
                  </p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${selectedRequest.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : selectedRequest.status === "in-progress"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                      }`}
                  >
                    {selectedRequest.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>
              </InfoWindow>
            );
          })()}
        </GoogleMap>

        {/* Floating Controls Overlay */}
        <MapControls
          center={center}
          setCenter={setCenter}
          radius={radius}
          setRadius={setRadius}
          map={map}
          onCalculateRoute={calculateRoute}
          onClearRoute={handleClearRoute}
          routeInfo={routeInfo}
          routeLoading={routeLoading}
        />

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-semibold text-gray-700">Loading requests...</span>
          </div>
        )}
      </div>
  );
};

export default MapView;
