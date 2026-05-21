import React from "react";

const HelpRequestCard = ({ request, onViewDetails }) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all">
      <h3 className="text-xl font-semibold text-blue-700 mb-2">
        <span className="font-medium">Category:</span> {request.category}
      </h3>
      <p className="text-gray-700 mb-1">
        <span className="font-medium">Name:</span> {request.name}
      </p>
      <p className="text-gray-700 mb-1">
        <span className="font-medium">Contact:</span> {request.contact}
      </p>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {request.description}
      </p>

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          📍 Lat: {request.latitude.toFixed(2)}, Lng: {request.longitude.toFixed(2)}
        </p>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(request._id)}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-all"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
};

export default HelpRequestCard;
