import api from "./api";

export const getUserById = async (id) => {
    try {
        console.log("🌐 Calling API: GET /users/" + id);
        const res = await api.get(`/users/${id}`);
        console.log("✅ API Success - user fetched:", res.data.user?.name);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};

export const getAllVictims = async () => {
    try {
        console.log("🌐 Calling API: GET /users/victims");
        const res = await api.get(`/users/victims`);
        console.log("✅ API Success - Victims fetched:", res.data.count);
        return res.data;
    } catch (err) {
        console.error("❌ API Error:", err.response?.data || err.message);
        throw err;
    }
};
