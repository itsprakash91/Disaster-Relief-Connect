import React, { useState, useEffect } from "react";
import { getDetailedVolunteers } from "../../api/admin";

const VolunteerManagement = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        try {
            setLoading(true);
            const response = await getDetailedVolunteers();
            setVolunteers(response);
            setError(null);
        } catch (err) {
            console.error("Error fetching volunteers:", err);
            setError("Failed to load volunteers");
        } finally {
            setLoading(false);
        }
    };

    // Filter volunteers by search term
    const filteredVolunteers = volunteers.filter((vol) =>
        vol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vol.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vol.phone.includes(searchTerm)
    );

    // Sort volunteers
    const sortedVolunteers = [...filteredVolunteers].sort((a, b) => {
        switch (sortBy) {
            case "name":
                return a.name.localeCompare(b.name);
            case "totalRequests":
                return (b.stats?.totalRequests || 0) - (a.stats?.totalRequests || 0);
            case "completionRate":
                return (b.stats?.completionRate || 0) - (a.stats?.completionRate || 0);
            default:
                return 0;
        }
    });

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
                Volunteer Management
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white shadow-md rounded-xl p-4 mb-6 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Search by Name/Email/Phone
                        </label>
                        <input
                            type="text"
                            placeholder="Search volunteers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Sort by
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Name</option>
                            <option value="totalRequests">Total Requests</option>
                            <option value="completionRate">Completion Rate</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Volunteers List */}
            {loading ? (
                <p className="text-center text-gray-600">Loading volunteers...</p>
            ) : sortedVolunteers.length === 0 ? (
                <p className="text-center text-gray-600">
                    {volunteers.length === 0
                        ? "No volunteers found."
                        : "No volunteers match your search."}
                </p>
            ) : (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    {sortedVolunteers.map((volunteer) => (
                        <div
                            key={volunteer._id}
                            className="bg-white shadow-md rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                        >
                            {/* Header with Avatar */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-700">
                                    {volunteer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {volunteer.name}
                                    </h3>
                                    <p className="text-sm text-gray-600">{volunteer.email}</p>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid md:grid-cols-2 gap-3 mb-4 pb-4 border-b">
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {volunteer.phone || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Address</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {volunteer.address || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Joined</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(volunteer.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="grid md:grid-cols-4 gap-2">
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600">Total Requests</p>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {volunteer.stats?.totalRequests || 0}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600">Completed</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {volunteer.stats?.completedRequests || 0}
                                    </p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold text-yellow-700">
                                        {volunteer.stats?.pendingRequests || 0}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-600">Completion %</p>
                                    <p className="text-2xl font-bold text-purple-700">
                                        {volunteer.stats?.completionRate || 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Performance Badge */}
                            <div className="mt-4">
                                {(volunteer.stats?.completionRate || 0) >= 80 && (
                                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                        ⭐ High Performer
                                    </span>
                                )}
                                {(volunteer.stats?.completionRate || 0) >= 50 &&
                                    (volunteer.stats?.completionRate || 0) < 80 && (
                                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                                            👍 Good Performance
                                        </span>
                                    )}
                                {(volunteer.stats?.completionRate || 0) < 50 && (
                                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                                        ⚠️ Needs Support
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 text-sm text-gray-600">
                <p>
                    Total Volunteers: <span className="font-semibold">{volunteers.length}</span>
                </p>
                <p>
                    Showing: <span className="font-semibold">{sortedVolunteers.length}</span> of{" "}
                    <span className="font-semibold">{volunteers.length}</span>
                </p>
            </div>
        </div>
    );
};

export default VolunteerManagement;
