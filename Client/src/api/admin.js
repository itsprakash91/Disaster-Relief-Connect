import api from "./api";

// Get admin dashboard stats
export const getDashboardStats = async () => {
    try {
        const response = await api.get("/admin/dashboard");
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};

// Get all camps
export const getAllCamps = async () => {
    try {
        const response = await api.get("/camps");
        return response.data?.data?.camps || response.data?.camps || [];
    } catch (error) {
        console.error("Error fetching camps:", error);
        throw error;
    }
};

// Create new camp
export const createCamp = async (campData) => {
    try {
        const response = await api.post("/camps", campData);
        return response.data.camp;
    } catch (error) {
        console.error("Error creating camp:", error);
        throw error;
    }
};

// Update camp
export const updateCamp = async (campId, campData) => {
    try {
        const response = await api.patch(`/camps/${campId}`, campData);
        return response.data.camp;
    } catch (error) {
        console.error("Error updating camp:", error);
        throw error;
    }
};

// Delete camp
export const deleteCamp = async (campId) => {
    try {
        const response = await api.delete(`/camps/${campId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting camp:", error);
        throw error;
    }
};

// Get all users (for admin user management)
export const getAllUsers = async (filters = {}) => {
    try {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/admin/users?${params}`);
        return response.data.users || [];
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

// Get detailed volunteer list
export const getDetailedVolunteers = async () => {
    try {
        const response = await api.get("/admin/volunteers");
        return response.data.volunteers || [];
    } catch (error) {
        console.error("Error fetching volunteers:", error);
        throw error;
    }
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
    try {
        const response = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
        return response.data.user;
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};

// Create user (admin only)
export const createUser = async (userData) => {
    try {
        const response = await api.post("/admin/users", userData);
        return response.data.user;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

// Update user details
export const updateUser = async (userId, userData) => {
    try {
        const response = await api.patch(`/admin/users/${userId}`, userData);
        return response.data.user;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

// Deactivate user
export const deactivateUser = async (userId) => {
    try {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data.user;
    } catch (error) {
        console.error("Error deactivating user:", error);
        throw error;
    }
};
