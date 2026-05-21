import React, { useEffect, useState } from "react";
import { getAllHelpRequests } from "../../api/helpRequests";
import { createDirectConversation } from "../../api/conversations";
import { getUserById } from "../../api/users";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function HelpRequestsList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            console.log("📥 Fetching help requests...");
            const data = await getAllHelpRequests();
            // Filter to show only pending/accepted requests
            const filtered = (data || []).filter(r => r.status === "pending" || r.status === "accepted");
            setRequests(filtered);
            console.log("✅ Help requests loaded:", filtered.length);
        } catch (err) {
            console.error("❌ Error fetching requests:", err);
            toast.error("Failed to load help requests");
        } finally {
            setLoading(false);
        }
    };

    const handleViewRequest = async (request) => {
        try {
            // request.user may be populated object or just an id string
            let victimId = request.user?._id || request.user;

            // if still missing, try fetching the full help request to get the user id
            if (!victimId) {
                console.log("🔍 victimId missing on request, refetching request details for:", request._id);
                const full = await getAllHelpRequests();
                // try to find the request in the refreshed list
                const found = (full || []).find(r => r._id === request._id);
                victimId = found?.user?._id || found?.user;
            }

            if (!victimId) {
                throw new Error("Could not determine victim for this help request");
            }

            console.log("🔍 Fetching victim info for:", victimId);
            const userRes = await getUserById(victimId);
            const victim = userRes.user;
            console.log("📇 Victim:", victim);
            toast.success(`Starting chat with ${victim.name} (${victim.phone || 'no phone'})`);

            // Start or fetch direct conversation with victim
            const data = await createDirectConversation({ victimId });
            navigate(`/chat/${data.conversation._id}`);
        } catch (err) {
            console.error("❌ Error starting conversation:", err);
            toast.error(err.response?.data?.message || err.message || "Failed to start chat");
        }
    };

    if (loading) {
        return (
            <div className="h-full p-4 border-r bg-gray-50">
                <h3 className="font-semibold text-lg mb-3">Help Requests</h3>
                <p className="text-gray-500 text-sm">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="h-full p-4 border-r bg-gray-50 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-3">🆘 Help Requests</h3>
            {requests.length === 0 ? (
                <p className="text-sm text-gray-500">No help requests available.</p>
            ) : (
                <ul className="space-y-3">
                    {requests.map((req) => (
                        <li key={req._id}>
                            <button
                                onClick={() => handleViewRequest(req)}
                                className="w-full text-left p-3 hover:bg-blue-100 rounded transition bg-white border border-gray-200 hover:shadow-md"
                            >
                                <div className="font-medium text-gray-900">{req.typeOfHelp?.toUpperCase()}</div>
                                <div className="text-xs text-gray-600 mt-1 line-clamp-2">{req.description}</div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500">By: {req.user?.name || "Unknown"}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${req.status === "accepted" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                        }`}>
                                        {req.status}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
