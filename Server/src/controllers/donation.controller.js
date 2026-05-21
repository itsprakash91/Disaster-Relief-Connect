import { Donation } from "../models/donation.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create new donation order
const createDonation = async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;

        // Validate amount (minimum Rs. 1 = 100 paise)
        if (!amount || amount < 1) {
            return res.status(400).json({
                success: false,
                message: "Amount must be at least Rs. 1"
            });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // convert to paise
            currency,
            receipt: `donation_${Date.now()}`,
            notes: {
                userId: req.user?._id?.toString(),
                purpose: "flood-relief"
            }
        });

        // Create donation record (pending)
        const donation = await Donation.create({
            user: req.user?._id,
            amount,
            currency,
            orderId: order.id,
            status: "pending"
        });

        return res.status(200).json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID, // frontend needs this
            order,
            donation
        });

    } catch (error) {
        console.error("createDonation error:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating donation",
            error: error.message
        });
    }
}

// Verify payment after Razorpay success
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        // Verify signature
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Update donation status
        const donation = await Donation.findOneAndUpdate(
            { orderId },
            { 
                status: "completed",
                completedAt: new Date(),
                paymentId
            },
            { new: true }
        ).populate('user', 'name');

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('donationCompleted', { donation });
        }

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            donation
        });

    } catch (error) {
        console.error("verifyPayment error:", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying payment",
            error: error.message
        });
    }
}

// Get my donations
const getMyDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ 
            user: req.user._id 
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {
        console.error("getMyDonations error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching your donations",
            error: error.message
        });
    }
}

// Get all donations (admin only)
const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        const stats = {
            total: await Donation.countDocuments({ status: "completed" }),
            amount: await Donation.aggregate([
                { 
                    $match: { status: "completed" }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ]).then(res => res[0]?.total || 0)
        };

        return res.status(200).json({
            success: true,
            stats,
            donations
        });

    } catch (error) {
        console.error("getAllDonations error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching donations",
            error: error.message
        });
    }
}

export {
    createDonation,
    verifyPayment,
    getMyDonations,
    getAllDonations
}