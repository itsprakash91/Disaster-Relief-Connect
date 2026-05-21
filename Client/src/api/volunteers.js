import api from "./api";

// Get all volunteers
export const getAllVolunteers = async () => {
    try {
        console.log("🌐 Calling API: GET /users/volunteers");
        const res = await api.get(`/users/volunteers`);
        console.log("✅ API Success - Volunteers fetched:", res.data.count);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};

// Create conversation with a volunteer
export const startConversationWithVolunteer = async (volunteerId) => {
    try {
        console.log("🌐 Calling API: POST /conversations/with-volunteer", volunteerId);
        const res = await api.post(`/conversations/with-volunteer`, { volunteerId });
        console.log("✅ API Success - Conversation started:", res.data);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};
