import React, { useEffect, useState } from "react";
import { getAllVictims } from "../../api/users";
import { createDirectConversation } from "../../api/conversations";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function VictimsList() {
    const [victims, setVictims] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchVictims();
    }, []);

    const fetchVictims = async () => {
        try {
            setLoading(true);
            console.log("📥 Fetching victims...");
            const data = await getAllVictims();
            setVictims(data.victims || []);
            console.log("✅ Victims loaded:", data.count);
        } catch (err) {
            console.error("❌ Error fetching victims:", err);
            toast.error("Failed to load victims");
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (victimId, victimName) => {
        try {
            console.log("🔄 Starting conversation with victim:", victimId);
            const data = await createDirectConversation({ victimId });
            toast.success(`Chat started with ${victimName}`);
            navigate(`/chat/${data.conversation._id}`);
        } catch (err) {
            console.error("❌ Error starting conversation:", err);
            toast.error(err.response?.data?.message || "Failed to start chat");
        }
    };

    if (loading) {
        return (
            <div className="h-full p-4 border-r bg-gray-50">
                <h3 className="font-semibold text-lg mb-3">Available Victims</h3>
                <p className="text-gray-500 text-sm">Loading victims...</p>
            </div>
        );
    }

    return (
        <div className="h-full p-4 border-r bg-gray-50 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-3">👥 Nearby Victims</h3>
            {victims.length === 0 ? (
                <p className="text-sm text-gray-500">No victims available yet.</p>
            ) : (
                <ul className="space-y-2">
                    {victims.map((v) => (
                        <li key={v._id}>
                            <button
                                onClick={() => handleStartChat(v._id, v.name)}
                                className="w-full text-left p-3 hover:bg-blue-100 rounded transition bg-white border border-gray-200 hover:shadow-md"
                            >
                                <div className="font-medium text-gray-900">{v.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{v.phone || v.email || 'No contact'}</div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
