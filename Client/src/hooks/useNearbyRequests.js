import { useEffect, useState } from "react";
import { getNearbyRequests } from "../api/helpRequests";
import { useGeoLocation } from "./useGeoLocation.js";

export const useNearbyRequests = (radius = 5000, interval = 30000) => {
  const { location } = useGeoLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNearby = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await getNearbyRequests(
        location.latitude,
        location.longitude,
        radius
      );
      setRequests(res || []);
    } catch (err) {
      console.error("Error fetching nearby requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby();
    const timer = setInterval(fetchNearby, interval);
    return () => clearInterval(timer);
  }, [location]);

  return { requests, loading };
};
