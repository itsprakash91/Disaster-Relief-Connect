import api from "./api";

export const getMyConversations = async () => {
    try {
        console.log("🌐 Calling API: GET /conversations/me");
        const res = await api.get(`/conversations/me`);
        console.log("✅ API Success:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};

export const getConversationByHelpRequest = async (helpRequestId) => {
    try {
        console.log("🌐 Calling API: GET /conversations/help-request/" + helpRequestId);
        const res = await api.get(`/conversations/help-request/${helpRequestId}`);
        console.log("✅ API Success:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};

export const createConversation = async (payload) => {
    try {
        console.log("🌐 Calling API: POST /conversations");
        const res = await api.post(`/conversations`, payload);
        console.log("✅ API Success:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};

// Create or fetch a direct conversation between users
export const createDirectConversation = async (payload) => {
    try {
        console.log("🌐 Calling API: POST /conversations/with-volunteer", payload);
        const res = await api.post(`/conversations/with-volunteer`, payload);
        console.log("✅ API Success - Direct conversation:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};
