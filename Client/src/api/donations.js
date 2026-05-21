// src/api/donations.js
import api from "./api";

/**
 * Create a new donation order (Razorpay)
 * @param {Object} donationData - { amount, currency }
 */
export const createDonation = async (donationData) => {
  const response = await api.post("/donations", { 
    amount: donationData.amount,
    currency: donationData.currency || "INR"
  });
  return response.data;
};

/**
 * Verify Razorpay payment
 * @param {Object} paymentData - { orderId, paymentId, signature }
 */
export const verifyDonationPayment = async (paymentData) => {
  const response = await api.post("/donations/verify", paymentData);
  return response.data;
};

/**
 * Get all donations (admin only)
 */
export const getAllDonations = async () => {
  const response = await api.get("/donations/all");
  return response.data?.donations || [];
};

/**
 * Get donations made by the logged-in user
 */
export const getUserDonations = async () => {
  const response = await api.get("/donations/my-donations");
  return response.data?.donations || [];
};

/**
 * Get a specific donation by ID
 * @param {String} id
 */
export const getDonationById = async (id) => {
  const response = await api.get(`/donations/${id}`);
  return response.data;
};

/**
 * Update donation status (admin or volunteer action)
 * @param {String} id - donation ID
 * @param {String} status - e.g., 'pending', 'approved', 'delivered'
 */
export const updateDonationStatus = async (id, status) => {
  const response = await api.patch(`/donations/${id}`, { status });
  return response.data;
};

/**
 * Delete a donation (admin only)
 * @param {String} id
 */
export const deleteDonation = async (id) => {
  const response = await api.delete(`/donations/${id}`);
  return response.data;
};

/**
 * Get donations near a location (for volunteers delivering supplies)
 * @param {Number} lat
 * @param {Number} lng
 * @param {Number} radius (in km)
 */
export const getNearbyDonations = async (lat, lng, radius = 10) => {
  const response = await api.get(
    `/donations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  return response.data;
};
