import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import { getMessages, postMessage, markSeen } from "../../api/messages";
import MessageBubble from "./MessageBubble";
import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";

export default function ChatWindow() {
    const { conversationId } = useParams();
    const { socket, joinRoom, joinConversation, leaveRoom } = useChat();
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const listRef = useRef();

    useEffect(() => {
        if (!conversationId) return;

        const load = async () => {
            try {
                setLoading(true);
                console.log("📥 Loading messages for conversation:", conversationId);
                const data = await getMessages(conversationId);
                console.log("✅ Messages loaded:", data.messages?.length || 0);
                setMessages(data.messages || []);
                // Mark seen
                await markSeen(conversationId);
            } catch (err) {
                console.error("❌ Error loading messages", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [conversationId]);

    useEffect(() => {
        if (!socket || !conversationId) return;

        console.log("🔌 Joining conversation:", conversationId);
        joinConversation(conversationId);

        const handleNewMessage = (msg) => {
            console.log("📨 New message received:", msg);

            // Accept either: full message object or wrapper { conversationId, message }
            const incoming = msg && msg.message ? msg.message : msg;
            if (!incoming || !incoming._id) {
                console.log("⚠️ Incoming message invalid", incoming);
                return;
            }

            const msgConvId = incoming.conversationId ? String(incoming.conversationId) : null;
            const paramConvId = String(conversationId);

            if (msgConvId === paramConvId) {
                // Avoid duplicates: if message with same _id already exists, skip
                setMessages((prev) => {
                    const exists = prev.some(m => String(m._id) === String(incoming._id));
                    if (exists) {
                        console.log("⚠️ Duplicate message received, skipping", incoming._id);
                        return prev;
                    }
                    console.log("✅ Adding message to state");
                    return [...prev, incoming];
                });
            } else {
                console.log("⚠️ Message conversation mismatch", { msgConvId, paramConvId });
            }
        };

        socket.on("newMessage", handleNewMessage);
        console.log("👂 Listening for newMessage events");

        return () => {
            console.log("🔌 Leaving room:", conversationId);
            socket.off("newMessage", handleNewMessage);
            leaveRoom(conversationId);
        };
    }, [socket, conversationId, joinConversation, leaveRoom]);

    useEffect(() => {
        // scroll to bottom
        if (listRef.current) {
            setTimeout(() => {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }, 0);
        }
    }, [messages]);

    const send = async () => {
        if (!text.trim() || !conversationId) return;
        try {
            const messageText = text.trim();
            console.log("📤 Sending message:", messageText, "to conv:", conversationId);

            // Optimistic UI update - add message immediately
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                conversationId,
                senderId: user._id,
                text: messageText,
                type: "text",
                createdAt: new Date().toISOString(),
            };
            console.log("📌 Temp message created:", tempMessage._id);
            setMessages((prev) => [...prev, tempMessage]);
            setText("");

            // Send to server
            const payload = { text: messageText, type: "text" };
            console.log("🌐 Posting to API...");
            const response = await postMessage(conversationId, payload);
            console.log("✅ Message saved by server:", response.message?._id);

            // Replace temp message with actual message from server
            if (response.message) {
                console.log("🔄 Replacing temp message with real one (dedup)");
                const newMsg = response.message;
                setMessages((prev) => {
                    // Find temp index
                    const tempIndex = prev.findIndex((m) => m._id === tempMessage._id);

                    // Remove any existing instance of the new message (socket may have already added it)
                    const filtered = prev.filter((m) => String(m._id) !== String(newMsg._id) && m._id !== tempMessage._id);

                    if (tempIndex >= 0) {
                        // Insert new message at the temp message position to preserve ordering
                        filtered.splice(tempIndex, 0, newMsg);
                        return filtered;
                    }

                    // If temp not found, just append if not present
                    return [...filtered, newMsg];
                });
            }
        } catch (err) {
            console.error("❌ Send message failed", err);
            // Remove temp message on error
            setMessages((prev) => prev.filter((m) => !m._id.startsWith("temp-")));
        }
    };

    if (!conversationId) {
        return <div className="h-full flex items-center justify-center text-gray-500">Select a conversation</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto p-4" ref={listRef}>
                {loading ? (
                    <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
                ) : (
                    messages.map((m) => <MessageBubble key={m._id} message={m} />)
                )}
            </div>

            <div className="p-3 border-t flex gap-2">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="flex-1 p-2 border rounded"
                    placeholder="Write a message..."
                />
                <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Send
                </button>
            </div>
        </div>
    );
}
