import React, { useEffect, useState } from "react";
import { getDashboardStats } from "../../api/admin";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    requests: 0,
    donations: 0,
    volunteers: 0,
    totalAmount: 0,
    totalVictims: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();

      if (response.success && response.stats) {
        setStats({
          requests: response.stats.totalHelpRequests || 0,
          donations: response.stats.totalDonations || 0,
          volunteers: response.stats.totalVolunteers || 0,
          totalAmount: response.stats.totalAmount || 0,
          totalVictims: response.stats.totalVictims || 0,
          pendingRequests: response.stats.pendingRequests || 0,
          completedRequests: response.stats.completedRequests || 0,
        });
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching admin stats", err);
      setError("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
        Admin Dashboard
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Requests */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-blue-600">
          <h3 className="text-sm font-semibold text-gray-700">
            Total Help Requests
          </h3>
          <p className="text-3xl font-bold text-blue-700 mt-2">
            {stats.requests}
          </p>
        </div>

        {/* Pending Requests */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-yellow-500">
          <h3 className="text-sm font-semibold text-gray-700">
            Pending Requests
          </h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {stats.pendingRequests}
          </p>
        </div>

        {/* Completed Requests */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-green-600">
          <h3 className="text-sm font-semibold text-gray-700">
            Completed Requests
          </h3>
          <p className="text-3xl font-bold text-green-700 mt-2">
            {stats.completedRequests}
          </p>
        </div>

        {/* Active Volunteers */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-purple-600">
          <h3 className="text-sm font-semibold text-gray-700">
            Active Volunteers
          </h3>
          <p className="text-3xl font-bold text-purple-700 mt-2">
            {stats.volunteers}
          </p>
        </div>

        {/* Total Victims */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-red-600">
          <h3 className="text-sm font-semibold text-gray-700">
            Registered Victims
          </h3>
          <p className="text-3xl font-bold text-red-700 mt-2">
            {stats.totalVictims}
          </p>
        </div>

        {/* Total Donations */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-green-600">
          <h3 className="text-sm font-semibold text-gray-700">
            Total Donations
          </h3>
          <p className="text-3xl font-bold text-green-700 mt-2">
            {stats.donations}
          </p>
        </div>

        {/* Total Amount */}
        <div className="bg-white shadow-md rounded-xl p-6 text-center border-t-4 border-indigo-600">
          <h3 className="text-sm font-semibold text-gray-700">
            Total Amount (₹)
          </h3>
          <p className="text-3xl font-bold text-indigo-700 mt-2">
            {stats.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-600">
          Manage camps, monitor requests, and coordinate volunteers effectively.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
