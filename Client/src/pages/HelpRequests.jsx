import React, { useState, useEffect, useContext } from "react";
import HelpRequestForm from "../components/HelpRequest/HelpRequestForm";
import {
  deleteHelpRequest,
  getAllHelpRequests,
  updateHelpRequest,
} from "../api/helpRequests";
import { getAllUsers } from "../api/admin";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const emptyEditForm = {
  typeOfHelp: "food",
  description: "",
  contact: "",
  address: "",
  status: "pending",
  assignedVolunteer: "",
};

const assignedStatuses = ["accepted", "in_progress", "completed", "cancelled"];

const getStatusClassName = (status) => {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  if (status === "in_progress") return "bg-purple-100 text-purple-700";
  if (status === "accepted") return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
};

export default function HelpRequests() {
  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRequests();
    if (user?.role === "admin") {
      fetchVolunteers();
    }
  }, [user, navigate]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllHelpRequests();
      setRequests(data || []);
      setError("");
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError(error.response?.data?.message || "Failed to load help requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const data = await getAllUsers({ role: "volunteer" });
      setVolunteers(data || []);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
    }
  };

  const openEdit = (request) => {
    setEditingRequest(request);
    setEditForm({
      typeOfHelp: request.typeOfHelp || "food",
      description: request.description || "",
      contact: request.contact || "",
      address: request.address || request.location?.address || "",
      status: request.status || "pending",
      assignedVolunteer: request.assignedVolunteer?._id || request.assignedVolunteer || "",
    });
    setError("");
    setSuccess("");
  };

  const closeEdit = () => {
    setEditingRequest(null);
    setEditForm(emptyEditForm);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRequest = async (event) => {
    event.preventDefault();
    if (!editingRequest) return;

    try {
      setSaving(true);
      setError("");
      const payload = {
        ...editForm,
        assignedVolunteer:
          assignedStatuses.includes(editForm.status)
            ? editForm.assignedVolunteer
            : "",
      };

      await updateHelpRequest(editingRequest._id, payload);
      setSuccess("Help request updated successfully");
      closeEdit();
      await fetchRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating help request:", error);
      setError(error.response?.data?.message || "Failed to update help request");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = async (request) => {
    const confirmed = window.confirm(
      `Delete this ${request.typeOfHelp} help request? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await deleteHelpRequest(request._id);
      setSuccess("Help request deleted successfully");
      await fetchRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting help request:", error);
      setError(error.response?.data?.message || "Failed to delete help request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Help Requests</h1>
        {user?.role === "victim" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
          >
            {showForm ? "View Requests" : "Create Request"}
          </button>
        )}
      </div>

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

      {showForm ? (
        <HelpRequestForm />
      ) : (
        <div>
          {loading ? (
            <p className="text-center text-gray-600">Loading requests...</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 mb-4">No help requests yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Create First Request
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
                >
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">
                    {request.typeOfHelp?.toUpperCase() || "Help Request"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {request.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClassName(request.status)}`}
                    >
                      {(request.status || "pending").replace("_", " ")}
                    </span>
                    <Link
                      to={`/request/${request._id}`}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                  {user?.role === "admin" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => openEdit(request)}
                        disabled={saving}
                        className="flex-1 text-sm border border-blue-200 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-50 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(request)}
                        disabled={saving}
                        className="flex-1 text-sm border border-red-200 text-red-700 px-3 py-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {request.location?.coordinates && (
                    <p className="text-xs text-gray-500 mt-2">
                      📍 Location: {request.location.coordinates[1]?.toFixed(2)},{" "}
                      {request.location.coordinates[0]?.toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Help Request</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="text-2xl leading-none text-gray-500 hover:text-gray-900"
              >
                x
              </button>
            </div>

            <form onSubmit={handleSaveRequest} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Type of Help
                  </span>
                  <select
                    name="typeOfHelp"
                    value={editForm.typeOfHelp}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="food">Food</option>
                    <option value="water">Water</option>
                    <option value="medical">Medical</option>
                    <option value="shelter">Shelter</option>
                    <option value="rescue">Rescue</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Status
                  </span>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Contact Number
                  </span>
                  <input
                    name="contact"
                    value={editForm.contact}
                    onChange={handleEditChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Assigned Volunteer
                  </span>
                  <select
                    name="assignedVolunteer"
                    value={editForm.assignedVolunteer}
                    onChange={handleEditChange}
                    disabled={!assignedStatuses.includes(editForm.status)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Unassigned</option>
                    {volunteers.map((volunteer) => (
                      <option key={volunteer._id} value={volunteer._id}>
                        {volunteer.name} {volunteer.phone ? `(${volunteer.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Address
                  </span>
                  <input
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Description
                  </span>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

