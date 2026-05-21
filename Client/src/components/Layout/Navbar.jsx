import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import HelpRequestForm from "../HelpRequest/HelpRequestForm";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowDropdown(false);
  };

  return (
    <>
      <nav className="bg-blue-700 text-white shadow-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold tracking-wide hover:text-yellow-300 transition-colors"
          >
            DisasterReliefConnect
          </Link>

          {/* Navigation Links - Only show if not logged in */}
          {!user && (
            <div className="space-x-6 hidden md:flex">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `hover:text-yellow-300 transition-colors ${isActive ? "text-yellow-300 font-semibold" : ""
                  }`
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/help-requests"
                className={({ isActive }) =>
                  `hover:text-yellow-300 transition-colors ${isActive ? "text-yellow-300 font-semibold" : ""
                  }`
                }
              >
                Help Requests
              </NavLink>

              <NavLink
                to="/donate"
                className={({ isActive }) =>
                  `hover:text-yellow-300 transition-colors ${isActive ? "text-yellow-300 font-semibold" : ""
                  }`
                }
              >
                Donate
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `hover:text-yellow-300 transition-colors ${isActive ? "text-yellow-300 font-semibold" : ""
                  }`
                }
              >
                About
              </NavLink>
            </div>
          )}

          {/* Auth Buttons - Only show if not logged in */}
          {!user && (
            <div className="hidden md:flex space-x-4">
              <Link
                to="/login"
                className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-yellow-400 text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition-all"
              >
                Register
              </Link>
            </div>
          )}

          {/* User Dropdown - Show if logged in */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-800 px-4 py-2 rounded-lg transition-all"
              >
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-semibold">
                  {user.name?.split(" ")[0] || "User"}
                </span>
                <span className="text-xs text-gray-300">({user.role})</span>
                <span className="text-lg">▼</span>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-blue-600 mt-1 capitalize">
                      {user.role}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowCreateRequest(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <span className="mr-2">➕</span>
                      Create Request
                    </button>

                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <span className="mr-2">👤</span>
                      Profile
                    </Link>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                    >
                      <span className="mr-2">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {!user && (
          <div className="md:hidden px-6 pb-3 flex justify-center space-x-4">
            <Link to="/login" className="hover:text-yellow-300">
              Login
            </Link>
            <Link to="/register" className="hover:text-yellow-300">
              Register
            </Link>
          </div>
        )}
      </nav>

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateRequest(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-700">
                Create Help Request
              </h2>
              <button
                onClick={() => setShowCreateRequest(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <HelpRequestForm
              onSuccess={() => setShowCreateRequest(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
