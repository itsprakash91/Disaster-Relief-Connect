import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChatClick = () => {
    if (user) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-blue-50 to-white">
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-extrabold text-blue-700 leading-tight mb-4">
          Disaster Relief Connect
        </h1>
        <p className="text-lg text-gray-700 mb-8 max-w-3xl mx-auto">
          Connect with volunteers, submit help requests, and donate to support
          communities affected by floods. Fast, simple and community-driven.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate("/map")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg shadow-md transition"
          >
            🗺️ {user ? "Open Map" : "Login to Open Map"}
          </button>
          <button
            onClick={handleChatClick}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg shadow-md transition"
          >
            💬 {user ? "Live Chat" : "Login for Live Chat"}
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Report Help Requests</h3>
            <p className="text-gray-600 text-sm">If you're affected, create a help request so volunteers can assist you.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Volunteer</h3>
            <p className="text-gray-600 text-sm">See nearby requests on the map and respond to people in need.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Donate</h3>
            <p className="text-gray-600 text-sm">Support relief efforts — donations are open to everyone.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
