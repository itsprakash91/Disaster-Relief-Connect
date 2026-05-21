import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    const socketUrl = useMemo(() => {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
        const url = apiUrl.replace(/\/api\/v1\/?$/, "");
        console.log("Socket URL =>", url);
        return url;
    }, []);

    useEffect(() => {
        if (!user) return; // only connect when authenticated

        const tokenToUse = token || sessionStorage.getItem("disaster_token");

        const s = io(socketUrl, {
            auth: { token: tokenToUse },
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        setSocket(s);

        s.on("connect", () => {
            console.log("✓ Chat socket connected", s.id);
        });

        s.on("connect_error", (err) => {
            console.error("✗ Chat socket connect error", err.message);
        });

        s.on("error", (err) => {
            console.error("✗ Chat socket error", err);
        });

        return () => {
            s.disconnect();
            setSocket(null);
        };
    }, [user, socketUrl]);

    const joinRoom = (roomId) => {
        if (socket && roomId) socket.emit("joinRoom", roomId);
    };

    const joinConversation = (conversationId) => {
        if (socket && conversationId) {
            console.log(`📞 Emitting joinConversation for: ${conversationId}`);
            socket.emit("joinConversation", { conversationId });
        }
    };

    const leaveRoom = (roomId) => {
        if (socket && roomId) socket.emit("leaveRoom", roomId);
    };

    const sendSocketMessage = (payload) => {
        if (socket) socket.emit("sendMessage", payload);
    };

    const value = {
        socket,
        joinRoom,
        joinConversation,
        leaveRoom,
        sendSocketMessage,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);
