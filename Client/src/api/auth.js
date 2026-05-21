// src/api/auth.js
import api from "./api";

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 */
export const registerUser = async (userData) => {
  const response = await api.post("/users/register", userData);
  return response.data;
};

/**
 * Login user and get access + refresh tokens
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/users/login", credentials);
  const { accessToken } = response.data;

  // Store access token in sessionStorage to avoid persistent auto-login
  if (accessToken) {
    sessionStorage.setItem("disaster_token", accessToken);
    localStorage.setItem("accessToken", accessToken);
  }

  return response.data;
};

/**
 * Logout user (clears refresh token from backend)
 */
export const logoutUser = async () => {
  try {
    await api.post("/users/logout");
  } finally {
    // Clear all auth storage keys to prevent stale login state
    localStorage.removeItem("accessToken");
    localStorage.removeItem("disaster_token");
    localStorage.removeItem("disaster_user");
    sessionStorage.removeItem("disaster_token");
    sessionStorage.removeItem("disaster_user");
  }
};

/**
 * Refresh access token (optional if handled in interceptor)
 */
export const refreshAccessToken = async () => {
  const response = await api.post("/users/refresh-token", {}, { withCredentials: true });
  const { accessToken } = response.data;
  localStorage.setItem("accessToken", accessToken);
  sessionStorage.setItem("disaster_token", accessToken);
  sessionStorage.setItem("flood_token", accessToken);
  return accessToken;
};

/**
 * Get current logged-in user's profile
 */
export const getProfile = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

/**
 * Update user profile
 * @param {Object} profileData - { name, avatar, phone, address, location }
 */
export const updateProfile = async (profileData) => {
  const response = await api.patch("/users/profile", profileData);
  return response.data;
};
