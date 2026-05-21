import React, { useEffect, useState } from "react";
import { getAllVolunteers, startConversationWithVolunteer } from "../../api/volunteers";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function VolunteersList() {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        try {
            setLoading(true);
            console.log("📥 Fetching volunteers...");
            const data = await getAllVolunteers();
            setVolunteers(data.volunteers || []);
            console.log("✅ Volunteers loaded:", data.count);
        } catch (err) {
            console.error("❌ Error fetching volunteers:", err);
            toast.error("Failed to load volunteers");
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (volunteerId, volunteerName) => {
        try {
            console.log("🔄 Starting conversation with volunteer:", volunteerId);
            const data = await startConversationWithVolunteer(volunteerId);
            toast.success(`Chat started with ${volunteerName}`);
            navigate(`/chat/${data.conversation._id}`);
        } catch (err) {
            console.error("❌ Error starting conversation:", err);
            toast.error(err.response?.data?.message || "Failed to start chat");
        }
    };

    if (loading) {
        return (
            <div className="h-full p-4 border-r bg-gray-50">
                <h3 className="font-semibold text-lg mb-3">Available Volunteers</h3>
                <p className="text-gray-500 text-sm">Loading volunteers...</p>
            </div>
        );
    }

    return (
        <div className="h-full p-4 border-r bg-gray-50 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-3">🤝 Available Volunteers</h3>
            {volunteers.length === 0 ? (
                <p className="text-sm text-gray-500">No volunteers available yet.</p>
            ) : (
                <ul className="space-y-2">
                    {volunteers.map((v) => (
                        <li key={v._id}>
                            <button
                                onClick={() => handleStartChat(v._id, v.name)}
                                className="w-full text-left p-3 hover:bg-blue-100 rounded transition bg-white border border-gray-200 hover:shadow-md"
                            >
                                <div className="font-medium text-gray-900">{v.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{v.email}</div>
                                <div className="text-xs text-green-600 mt-1">✓ Available</div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
