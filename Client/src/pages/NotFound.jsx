import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-[80vh] flex flex-col justify-center items-center text-center">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-gray-600 mb-6">Oops! The page you're looking for doesn’t exist.</p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
      >
        Go Home
      </Link>
    </div>
  );
}
