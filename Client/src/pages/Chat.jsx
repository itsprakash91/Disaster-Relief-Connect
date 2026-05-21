import React, { useContext } from "react";
import VolunteersList from "../components/Chat/VolunteersList";
import VictimsList from "../components/Chat/VictimsList";
import ChatWindow from "../components/Chat/ChatWindow";
import { ChatProvider } from "../contexts/ChatContext";
import { AuthContext } from "../contexts/AuthContext";

export default function ChatPage() {
    const { user } = useContext(AuthContext);
    const isVictim = user?.role === "victim";

    return (
        <ChatProvider>
            <div className="w-full h-screen flex">
                <div className="w-1/3 border-r h-full overflow-auto bg-gray-50 flex flex-col">
                    <div className="flex-1 overflow-y-auto">
                        {isVictim ? <VolunteersList /> : <VictimsList />}
                    </div>
                </div>
                <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
                    <ChatWindow />
                </div>
            </div>
        </ChatProvider>
    );
}
