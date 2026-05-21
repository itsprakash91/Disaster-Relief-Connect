import React from "react";
import MapView from "../components/Map/MapView";

export default function MapDashboard() {
  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-white">
      <MapView />
    </div>
  );
}
