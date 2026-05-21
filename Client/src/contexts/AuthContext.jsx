import React, { createContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/auth";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Only load from sessionStorage to prevent persistence across sessions
    const stored = sessionStorage.getItem("disaster_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => sessionStorage.getItem("disaster_token") || null);

  useEffect(() => {
    // store auth state in sessionStorage only
    if (user) sessionStorage.setItem("disaster_user", JSON.stringify(user));
    else sessionStorage.removeItem("disaster_user");
  }, [user]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("disaster_token", token);
      localStorage.setItem("accessToken", token);
    } else {
      sessionStorage.removeItem("disaster_token");
      localStorage.removeItem("accessToken");
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await loginUser({ email, password });

      if (res && res.success) {
        setUser(res.user);
        setToken(res.accessToken);
        toast.success("Logged in successfully!");
      } else {
        throw new Error(res?.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || err.message || "Invalid credentials"
      );
      throw err;
    }
  };


  const register = async (formData) => {
    try {
      const res = await registerUser(formData);
      if (res && res.success) {
        setUser(res.user);
        setToken(res.accessToken);
        toast.success("Account created successfully!");
      } else {
        throw new Error(res?.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Registration failed");
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // clear both sessionStorage and localStorage for all possible keys
    try {
      sessionStorage.removeItem("disaster_user");
      sessionStorage.removeItem("disaster_token");
      localStorage.removeItem("disaster_user");
      localStorage.removeItem("disaster_token");
      localStorage.removeItem("accessToken");
    } catch (e) {
      console.warn("Storage clear failed", e);
    }
    toast("Logged out successfully!");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
