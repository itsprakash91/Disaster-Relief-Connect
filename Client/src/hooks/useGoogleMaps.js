import { useEffect, useState } from "react";

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_MAP_KEY;

    if (!apiKey) {
      setLoadError("Google Maps API key not found. Please add VITE_MAP_KEY to .env file");
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setIsLoaded(true);
      });
      existingScript.addEventListener("error", () => {
        setLoadError("Failed to load Google Maps script");
      });
      return;
    }

    // Create and load script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", () => {
      setIsLoaded(true);
    });

    script.addEventListener("error", () => {
      setLoadError("Failed to load Google Maps script");
    });

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Function to add search hints and markers on the map
  function addSearchHintsAndMarkers(searchResults) {
    searchResults.forEach(result => {
      const marker = new google.maps.Marker({
        position: result.location,
        map: map,
        title: result.name,
      });
      // Add hint for the marker
      const infoWindow = new google.maps.InfoWindow({
        content: result.name,
      });
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  }

  return { isLoaded, loadError, addSearchHintsAndMarkers };
};

