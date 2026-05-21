import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthContext } from "./contexts/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import Footer from "./components/Layout/Footer";

import Home from "./pages/Home";
import MapDashboard from "./pages/MapDashboard";
import RequestDetails from "./pages/RequestDetails";
import Donate from "./pages/Donate";
import Profile from "./pages/Profile";
import HelpRequests from "./pages/HelpRequests";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import AdminDashboard from "./components/Admin/AdminDashboard";
import CampsManager from "./components/Admin/CampsManager";
import UserManagement from "./components/Admin/UserManagement";
import VolunteerDashboard from "./components/Volunteer/VolunteerDashboard";
import ChatPage from "./pages/Chat";

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {user && <Sidebar />}

        <main className={`flex-1 transition-all ${user ? 'ml-64' : ''}`}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<MapDashboard />} />
            <Route path="/help-requests" element={<HelpRequests />} />
            <Route path="/camps" element={<CampsManager />} />
            <Route path="/request/:id" element={<RequestDetails />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Volunteer routes */}
            <Route path="/volunteer" element={<VolunteerDashboard />} />

            {/* Chat */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/camps" element={<CampsManager />} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
}
