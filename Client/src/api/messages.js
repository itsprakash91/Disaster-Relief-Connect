import api from "./api";

export const getMessages = async (conversationId) => {
    const res = await api.get(`/messages/${conversationId}`);
    return res.data;
};

export const postMessage = async (conversationId, payload) => {
    const res = await api.post(`/messages/${conversationId}`, payload);
    return res.data;
};

export const markSeen = async (conversationId) => {
    const res = await api.post(`/messages/${conversationId}/seen`);
    return res.data;
};
