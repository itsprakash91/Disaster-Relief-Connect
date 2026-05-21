import { useState, useEffect } from "react";

export const useGeoLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          lat: pos.coords.latitude, // Also add lat/lng for backward compatibility
          lng: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        console.warn(err.message);
        setError("Unable to fetch location. Please allow location access.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Auto-fetch on mount (optional)
  useEffect(() => {
    // Don't auto-fetch, let user click button instead
    // getLocation();
  }, []);

  return { location, loading, error, getLocation };
};
