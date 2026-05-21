import React, { useContext, useEffect, useState } from "react";
import { createCamp, deleteCamp, getAllCamps, updateCamp } from "../../api/admin";
import { AuthContext } from "../../contexts/AuthContext";

const initialFormData = {
  name: "",
  address: "",
  capacity: "",
  contact: "",
  coordinator: "",
  description: "",
};

const CampsManager = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      setLoading(true);
      const response = await getAllCamps();
      setCamps(response);
      setError("");
    } catch (err) {
      console.error("Error fetching camps:", err);
      setError(err.response?.data?.message || "Failed to load camps");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCamp = async (event) => {
    event.preventDefault();

    if (!isAdmin) return;

    if (!formData.name || !formData.address || !formData.capacity || !formData.contact) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await createCamp({
        ...formData,
        capacity: Number(formData.capacity),
        location: {
          coordinates: [77.209, 28.6139],
        },
      });
      setSuccess("Camp created successfully");
      setFormData(initialFormData);
      await fetchCamps();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating camp:", err);
      setError(err.response?.data?.message || "Failed to create camp");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (campId, currentStatus) => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const newStatus = currentStatus === "Active" ? "Closed" : "Active";
      await updateCamp(campId, { status: newStatus });
      setSuccess("Camp status updated successfully");
      await fetchCamps();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating camp status:", err);
      setError(err.response?.data?.message || "Failed to update camp status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCamp = async (campId) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to delete this camp?")) return;

    try {
      setLoading(true);
      await deleteCamp(campId);
      setSuccess("Camp deleted successfully");
      await fetchCamps();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting camp:", err);
      setError(err.response?.data?.message || "Failed to delete camp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-blue-800 mb-2 text-center">
        {isAdmin ? "Camps Manager" : "Relief Camps"}
      </h2>
      <p className="text-center text-gray-600 mb-6">
        {isAdmin
          ? "Create and manage relief camps."
          : "View available relief camps created by the admin team."}
      </p>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      {isAdmin && (
        <form
          onSubmit={handleAddCamp}
          className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Add New Relief Camp
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Camp Name *"
              value={formData.name}
              onChange={handleChange}
              required
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="address"
              placeholder="Address *"
              value={formData.address}
              onChange={handleChange}
              required
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="capacity"
              placeholder="Capacity *"
              value={formData.capacity}
              onChange={handleChange}
              required
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              name="contact"
              placeholder="Contact Number *"
              value={formData.contact}
              onChange={handleChange}
              required
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="coordinator"
              placeholder="Coordinator Name"
              value={formData.coordinator}
              onChange={handleChange}
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              rows="1"
              className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 md:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 transition-all disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Camp"}
          </button>
        </form>
      )}

      {loading && camps.length === 0 ? (
        <p className="text-center text-gray-600">Loading camps...</p>
      ) : camps.length === 0 ? (
        <p className="text-center text-gray-600">
          {isAdmin ? "No camps found. Create one!" : "No relief camps available right now."}
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {camps.map((camp) => (
            <div
              key={camp._id}
              className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-xl font-semibold text-blue-700">
                  {camp.name}
                </h3>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    camp.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : camp.status === "Full"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {camp.status}
                </span>
              </div>

              <p className="text-gray-600 mb-1">{camp.address}</p>
              <p className="text-gray-600 mb-1">
                Capacity: {camp.occupancy || 0}/{camp.capacity}
              </p>
              <p className="text-gray-600 mb-1">Contact: {camp.contact}</p>
              {camp.coordinator && (
                <p className="text-gray-600 mb-1">Coordinator: {camp.coordinator}</p>
              )}
              {camp.description && (
                <p className="text-gray-600 mb-3 text-sm">{camp.description}</p>
              )}

              {isAdmin && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(camp._id, camp.status)}
                    disabled={loading}
                    className="flex-1 bg-gray-200 text-sm px-3 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    {camp.status === "Active" ? "Close" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDeleteCamp(camp._id)}
                    disabled={loading}
                    className="flex-1 bg-red-100 text-sm text-red-700 px-3 py-2 rounded-md hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampsManager;
