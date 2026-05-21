import React, { useEffect, useState, useContext } from "react";
import { getMyConversations } from "../../api/conversations";
import { Link, useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { AuthContext } from "../../contexts/AuthContext";

export default function Conversations() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { socket } = useChat();
    const { user } = useContext(AuthContext);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            console.log("🔄 Fetching conversations...");
            const data = await getMyConversations();
            console.log("✅ API Response:", data);
            console.log("✅ Conversations array:", data.conversations);
            console.log("✅ Total conversations:", data.count);
            setConversations(data.conversations || []);
        } catch (err) {
            console.error("❌ Error fetching convs:", err.message);
            console.error("❌ Full error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // initial fetch
        fetchConversations();

        // If socket is available, listen for real-time creation of help requests/conversations
        if (!socket) return;

        const handleCreated = (payload) => {
            try {
                console.log("🔔 helpRequestCreated payload:", payload);
                const newConv = payload?.conversation;
                if (!newConv || !newConv._id) return;

                setConversations((prev) => {
                    if (prev.find((c) => c._id === newConv._id)) return prev;
                    return [newConv, ...prev];
                });
            } catch (err) {
                console.error("Error handling helpRequestCreated:", err);
            }
        };

        const handleAccepted = (payload) => {
            try {
                console.log("🔔 helpRequestAccepted payload:", payload);
                const conv = payload?.conversation;
                if (!conv || !conv._id) return;

                setConversations((prev) => {
                    // replace or add
                    const exists = prev.find((c) => c._id === conv._id);
                    if (exists) return prev.map((c) => (c._id === conv._id ? conv : c));
                    return [conv, ...prev];
                });
            } catch (err) {
                console.error("Error handling helpRequestAccepted:", err);
            }
        };

        const handleConvUpdated = (conv) => {
            try {
                console.log('🔔 conversationUpdated:', conv);
                if (!conv || !conv._id) return;
                setConversations((prev) => {
                    // Update the conversation and move it to the top (most recent first)
                    const updated = prev.map((c) => (c._id === conv._id ? conv : c));
                    // Sort by updatedAt descending
                    return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
            } catch (err) {
                console.error('Error handling conversationUpdated:', err);
            }
        };

        socket.on("helpRequestCreated", handleCreated);
        socket.on("helpRequestAccepted", handleAccepted);
        socket.on("conversationUpdated", handleConvUpdated);

        return () => {
            socket.off("helpRequestCreated", handleCreated);
            socket.off("helpRequestAccepted", handleAccepted);
            socket.off("conversationUpdated", handleConvUpdated);
        };
    }, [socket]);

    if (loading && conversations.length === 0) {
        return (
            <div className="h-full p-4 border-r bg-gray-50">
                <h3 className="font-semibold text-lg mb-3">Conversations</h3>
                <p className="text-gray-500 text-sm">Loading conversations...</p>
            </div>
        );
    }

    return (
        <div className="h-full p-4 border-r bg-gray-50 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-4">Start a conversation</p>
            {conversations.length === 0 ? (
                <p className="text-sm text-gray-400">No conversations yet</p>
            ) : (
                <ul className="space-y-2">
                    {conversations.map((c) => {
                        // Determine which participant is "the other person"
                        const isCurrentUserVictim = user?.role === "victim";
                        const otherParticipant = isCurrentUserVictim ? c?.volunteerId : c?.victimId;
                        const displayName = otherParticipant?.name || "Unknown";
                        const displayInfo = otherParticipant?.phone || otherParticipant?.email || "No contact";

                        return (
                            <li key={c._id}>
                                <button
                                    onClick={() => {
                                        console.log("📍 Navigating to chat:", c._id);
                                        navigate(`/chat/${c._id}`);
                                    }}
                                    className="w-full text-left p-3 hover:bg-blue-100 rounded transition bg-white border border-gray-200"
                                >
                                    <div className="font-medium text-gray-900">{displayName}</div>
                                    <div className="text-xs text-gray-500 mt-1">{displayInfo}</div>
                                    <div className="text-xs text-gray-400 mt-1">Case: {c?.caseCode}</div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
