import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return null; // Don't show sidebar if not logged in
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-900 text-white shadow-lg">
      <div className="p-4 space-y-2 pt-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-3 mb-4">
          Dashboards
        </h3>

        {/* Admin Dashboard Link */}
        {user.role === "admin" && (
          <Link
            to="/admin"
            className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/admin")
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-800 text-gray-300"
              }`}
          >
            <span className="mr-3">📊</span>
            Admin Dashboard
          </Link>
        )}

        {/* Volunteer Dashboard Link */}
        {user.role === "volunteer" && (
          <Link
            to="/volunteer"
            className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/volunteer")
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-800 text-gray-300"
              }`}
          >
            <span className="mr-3">🤝</span>
            Volunteer Dashboard
          </Link>
        )}

        {/* Admin only routes */}
        {user.role === "admin" && (
          <>
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/admin/users")
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
                }`}
            >
              <span className="mr-3"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M420-80v-280H320v-240q0-33 23.5-56.5T400-680h160q33 0 56.5 23.5T640-600v240H540v280H420Zm60-640q-33 0-56.5-23.5T400-800q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800q0 33-23.5 56.5T480-720Z" /></svg></span>
              User Management
            </Link>

            <Link
              to="/admin/camps"
              className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/admin/camps")
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-800 text-gray-300"
                }`}
            >
              <span className="mr-3">🏕️</span>
              Camps Manager
            </Link>
          </>
        )}

        <div className="border-t border-gray-700 my-4"></div>

        {/* Quick Links */}
        <h3 className="text-sm font-semibold text-gray-400 uppercase px-3 mb-4">
          Quick Links
        </h3>

        <Link
          to="/map"
          className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/map")
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-800 text-gray-300"
            }`}
        >
          <span className="mr-3">🗺️</span>
          View Map
        </Link>

        <Link
          to="/help-requests"
          className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/help-requests")
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-800 text-gray-300"
            }`}
        >
          <span className="mr-3">📋</span>
          Help Requests
        </Link>

        <Link
          to="/camps"
          className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/camps")
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-800 text-gray-300"
            }`}
        >
          <span className="mr-3">🏕️</span>
          Relief Camps
        </Link>

        <Link
          to="/donate"
          className={`flex items-center px-4 py-3 rounded-lg transition-all ${isActive("/donate")
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-800 text-gray-300"
            }`}
        >
          <span className="mr-3">💚</span>
          Donate
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
