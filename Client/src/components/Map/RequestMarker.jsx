import React from "react";
import { Marker } from "@react-google-maps/api";

// Custom marker icon (you can use a custom icon URL or default)
const createCustomIcon = (color = "#4285F4") => {
  if (window.google && window.google.maps && window.google.maps.SymbolPath) {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 8,
    };
  }
  // Fallback if Google Maps not loaded yet
  return {
    path: "circle",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 8,
  };
};

const RequestMarker = ({ position, request, onClick }) => {
  // Determine marker color based on request status
  const getMarkerColor = () => {
    if (request.status === "completed") return "#34A853"; // Green
    if (request.status === "accepted") return "#FBBC04"; // Yellow
    return "#EA4335"; // Red for pending/urgent
  };

  const icon = createCustomIcon(getMarkerColor());

  return (
    <Marker
      position={position}
      icon={icon}
      onClick={onClick}
      title={
        request.typeOfHelp?.toUpperCase() ||
        request.category?.toUpperCase() ||
        "Help Request"
      }
    />
  );
};

export default RequestMarker;
