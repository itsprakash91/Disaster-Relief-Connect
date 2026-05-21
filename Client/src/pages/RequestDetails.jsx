
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getHelpRequestById } from "../api/helpRequests";
import { toast } from "react-hot-toast";

export default function RequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await getHelpRequestById(id);
        setRequest(res?.helpRequest || res);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load request details");
      }
    };

    fetchRequest();
  }, [id]);

  if (!request) {
    return <p className="text-center mt-8 text-gray-600">Loading...</p>;
  }

  const coordinates = request.location?.coordinates;
  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates.every((value) => typeof value === "number");
  const destinationLat = hasCoordinates ? coordinates[1] : null;
  const destinationLng = hasCoordinates ? coordinates[0] : null;
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`
    : "";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg mt-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-2">
        {request.typeOfHelp?.toUpperCase() || "Help Request"}
      </h2>

      <p className="text-gray-600 mb-4">{request.description}</p>

      <p className="mb-2">
        <strong>Requested By:</strong> {request.user?.name || "N/A"}
      </p>
      <p className="mb-2">
        <strong>Type:</strong> {request.typeOfHelp || "N/A"}
      </p>
      <p className="mb-2">
        <strong>Contact Number:</strong> {request.contact || "N/A"}
      </p>
      <p className="mb-2">
        <strong>Location Coordinates:</strong>{" "}
        {hasCoordinates
          ? `Lat: ${destinationLat.toFixed(4)}, Lng: ${destinationLng.toFixed(4)}`
          : "N/A"}
      </p>
      <p className="mb-2">
        <strong>Address:</strong>{" "}
        {request.address || request.location?.address || "No address provided"}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        <span
          className={`font-semibold ${request.status === "completed"
            ? "text-green-600"
            : request.status === "accepted"
              ? "text-yellow-600"
              : "text-blue-600"
            }`}
        >
          {request.status}
        </span>
      </p>

      {hasCoordinates ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 md:w-auto"
        >
          Navigate to Victim Location
        </a>
      ) : (
        <p className="mt-6 rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Victim location coordinates are not available for navigation.
        </p>
      )}
    </div>
  );
}
