// src/api/api.js
import axios from "axios";

// Base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true, // include cookies (useful if backend sets httpOnly cookies)
});

// ✅ Request Interceptor — attaches access token to every request
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("disaster_token") ||
      sessionStorage.getItem("flood_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor — handles expired tokens or global errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try refreshing it once
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/users/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = refreshResponse.data;
        localStorage.setItem("accessToken", accessToken);
        sessionStorage.setItem("disaster_token", accessToken);
        sessionStorage.setItem("flood_token", accessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear storage on refresh failure
        sessionStorage.removeItem("disaster_token");
        sessionStorage.removeItem("flood_token");
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }

    // Handle network errors or other statuses
    if (error.message === "Network Error") {
      console.error("Network error. Please check your internet connection.");
    } else {
      console.error("API Error:", error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
