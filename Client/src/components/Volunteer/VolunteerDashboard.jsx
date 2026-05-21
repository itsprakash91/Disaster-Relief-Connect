import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  getMyAssignedRequests,
  getNearbyRequests,
  rejectHelpRequest,
  updateHelpRequestStatus,
} from "../../api/helpRequests";
import { useGeoLocation } from "../../hooks/useGeoLocation";
import { toast } from "react-hot-toast";

const statusStyles = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  accepted: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-violet-50 text-violet-700 border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const formatStatus = (status) => (status || "pending").replace("_", " ");

const getCoordinates = (request) => {
  const coordinates = request.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return null;
  return { lng: coordinates[0], lat: coordinates[1] };
};

const RequestSummary = ({ request }) => {
  const coordinates = getCoordinates(request);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {request.typeOfHelp || "Help"} Request
        </h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[request.status] || statusStyles.pending
            }`}
        >
          {formatStatus(request.status)}
        </span>
      </div>

      <p className="text-sm text-gray-700">{request.description}</p>

      <div className="grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
        <p>
          <span className="font-medium text-gray-800">Victim:</span>{" "}
          {request.user?.name || "Not available"}
        </p>
        <p>
          <span className="font-medium text-gray-800">Contact:</span>{" "}
          {request.contact || "Not available"}
        </p>
        <p className="sm:col-span-2">
          <span className="font-medium text-gray-800">Address:</span>{" "}
          {request.address || request.location?.address || "No address provided"}
        </p>
        {coordinates && (
          <p className="sm:col-span-2">
            <span className="font-medium text-gray-800">Location:</span>{" "}
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
};

export default function VolunteerDashboard() {
  const { user } = useContext(AuthContext);
  const { location, loading: geoLoading, error: geoError, getLocation } = useGeoLocation();
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [dismissedRequests, setDismissedRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const visibleNearbyRequests = useMemo(
    () =>
      nearbyRequests.filter(
        (request) =>
          request.status === "pending" && !dismissedRequests.includes(request._id)
      ),
    [nearbyRequests, dismissedRequests]
  );

  useEffect(() => {
    fetchAssigned();
    fetchNearby();
    getLocation();
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchNearby();
  }, [location]);

  const fetchNearby = async () => {
    try {
      setLoadingNearby(true);
      const data = location
        ? await getNearbyRequests(location.latitude, location.longitude, 5000)
        : await getNearbyRequests();
      setNearbyRequests(data || []);
    } catch (err) {
      console.error("Error fetching nearby requests:", err);
      toast.error(err.response?.data?.message || "Failed to fetch nearby requests");
    } finally {
      setLoadingNearby(false);
    }
  };

  const fetchAssigned = async () => {
    try {
      setLoadingAssigned(true);
      const data = await getMyAssignedRequests();
      setAssignedRequests(data || []);
      setNotes(
        (data || []).reduce((acc, request) => {
          acc[request._id] = request.volunteerNotes || "";
          return acc;
        }, {})
      );
    } catch (err) {
      console.error("Error fetching assigned requests:", err);
      toast.error(err.response?.data?.message || "Failed to fetch assigned tasks");
    } finally {
      setLoadingAssigned(false);
    }
  };

  const handleAccept = async (requestId) => {
    if (!user?._id) {
      toast.error("Please login to accept requests");
      return;
    }

    try {
      setBusyId(requestId);
      const response = await updateHelpRequestStatus(requestId, "accepted", user._id);
      toast.success("Request accepted");
      setNearbyRequests((prev) => prev.filter((request) => request._id !== requestId));
      setAssignedRequests((prev) => [response.helpRequest, ...prev]);
      setNotes((prev) => ({ ...prev, [requestId]: response.helpRequest?.volunteerNotes || "" }));
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error(err.response?.data?.message || "Failed to accept request");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setBusyId(requestId);
      await rejectHelpRequest(requestId);
      setDismissedRequests((prev) => [...prev, requestId]);
      setNearbyRequests((prev) => prev.filter((request) => request._id !== requestId));
      toast("Request rejected");
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setBusyId(null);
    }
  };

  const updateAssignedRequest = async (requestId, status, successMessage, extraData = {}) => {
    try {
      setBusyId(requestId);
      const response = await updateHelpRequestStatus(requestId, status, null, extraData);
      setAssignedRequests((prev) =>
        prev.map((request) =>
          request._id === requestId ? response.helpRequest : request
        )
      );
      setNotes((prev) => ({
        ...prev,
        [requestId]: response.helpRequest?.volunteerNotes || prev[requestId] || "",
      }));
      toast.success(successMessage);
    } catch (err) {
      console.error("Error updating request:", err);
      toast.error(err.response?.data?.message || "Failed to update request");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNotes = (requestId) => {
    const request = assignedRequests.find((item) => item._id === requestId);
    updateAssignedRequest(requestId, request?.status || "accepted", "Notes saved", {
      volunteerNotes: notes[requestId] || "",
    });
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Volunteer Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Accept nearby requests, track your assigned tasks, and keep field notes updated.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Nearby Requests</h2>
              <p className="text-sm text-gray-500">
                {location
                  ? "Pending requests within 5 km."
                  : "Showing available pending requests until location is available."}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchNearby}
              disabled={loadingNearby}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Refresh
            </button>
          </div>

          {!location && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p>
                Location permission pending. You can still accept available requests, or allow
                location access to narrow this list to nearby requests.
              </p>
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLoading}
                className="mt-2 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {geoLoading ? "Getting Location..." : "Enable Location"}
              </button>
              {geoError && <p className="mt-2 text-xs">{geoError}</p>}
            </div>
          )}

          {geoLoading || loadingNearby ? (
            <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
              Loading nearby requests...
            </p>
          ) : visibleNearbyRequests.length === 0 ? (
            <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
              No pending help requests nearby.
            </p>
          ) : (
            <div className="space-y-4">
              {visibleNearbyRequests.map((request) => (
                <article key={request._id} className="rounded-lg border border-gray-200 p-4">
                  <RequestSummary request={request} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccept(request._id)}
                      disabled={busyId === request._id}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(request._id)}
                      disabled={busyId === request._id}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Assigned Tasks</h2>
              <p className="text-sm text-gray-500">Requests accepted by you.</p>
            </div>
            <button
              type="button"
              onClick={fetchAssigned}
              disabled={loadingAssigned}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Refresh
            </button>
          </div>

          {loadingAssigned ? (
            <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
              Loading assigned tasks...
            </p>
          ) : assignedRequests.length === 0 ? (
            <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
              You have not accepted any requests yet.
            </p>
          ) : (
            <div className="space-y-4">
              {assignedRequests.map((request) => {
                const isDone = ["completed", "cancelled"].includes(request.status);

                return (
                  <article key={request._id} className="rounded-lg border border-gray-200 p-4">
                    <RequestSummary request={request} />

                    <label className="mt-4 block text-sm font-medium text-gray-800">
                      Notes
                      <textarea
                        value={notes[request._id] || ""}
                        onChange={(event) =>
                          setNotes((prev) => ({
                            ...prev,
                            [request._id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Add rescue details, supplies delivered, or follow-up needs"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateAssignedRequest(
                            request._id,
                            "in_progress",
                            "Marked as reached",
                            { volunteerNotes: notes[request._id] || "" }
                          )
                        }
                        disabled={busyId === request._id || isDone || request.status === "in_progress"}
                        className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-violet-300"
                      >
                        Mark as Reached
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateAssignedRequest(
                            request._id,
                            "completed",
                            "Marked as completed",
                            { volunteerNotes: notes[request._id] || "" }
                          )
                        }
                        disabled={busyId === request._id || isDone}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        Mark as Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(request._id)}
                        disabled={busyId === request._id}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        Save Notes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateAssignedRequest(
                            request._id,
                            "cancelled",
                            "Task cancelled",
                            { volunteerNotes: notes[request._id] || "" }
                          )
                        }
                        disabled={busyId === request._id || isDone}
                        className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed"
                      >
                        Cancel Task
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
