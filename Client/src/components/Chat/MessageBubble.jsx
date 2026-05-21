import React, { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

export default function MessageBubble({ message }) {
    const { user } = useContext(AuthContext);

    if (!message || !message._id) {
        return null; // Skip rendering invalid messages
    }

    // Handle both populated object and string/ObjectId for senderId
    const senderId = message.senderId?._id || message.senderId;
    const senderName = message.senderId?.name || "Unknown";
    const mine = user && String(senderId) === String(user._id);

    return (
        <div className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`${mine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} p-3 rounded-lg max-w-[70%] wrap-break-word`}>
                {!mine && (
                    <div className="text-xs font-semibold mb-1 opacity-75">{senderName}</div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.text || "(empty message)"}</div>
                <div className={`text-xs ${mine ? 'text-blue-100' : 'text-gray-500'} mt-1 text-right`}>
                    {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""}
                </div>
            </div>
        </div>
    );
}
