import { HelpRequest } from "../models/helpRequest.model.js";
import { User } from "../models/user.model.js";
// import { Donation } from "../models/donation.model.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};

const generateAccessAndRefreshTokens = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found"
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        res.cookie("accessToken", accessToken, {
            ...cookieOptions,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const admin = user.toObject();
        delete admin.password;
        delete admin.refreshToken;

        return res.status(200).json({
            success: true,
            message: "Admin logged in successfully",
            user: admin,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("adminLogin error:", error);
        return res.status(500).json({
            success: false,
            message: "Error logging in admin",
            error: error.message
        });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const stats = {
            totalHelpRequests: await HelpRequest.countDocuments(),
            pendingRequests: await HelpRequest.countDocuments({ status: "pending" }),
            completedRequests: await HelpRequest.countDocuments({ status: "completed" }),
            totalVolunteers: await User.countDocuments({ role: "volunteer" }),
            totalVictims: await User.countDocuments({ role: "victim" })
        };

        // Get donations stats
        // const donationStats = await Donation.aggregate([
        //     {
        //         $match: { status: "completed" }
        //     },
        //     {
        //         $group: {
        //             _id: null,
        //             totalAmount: { $sum: "$amount" },
        //             totalDonations: { $sum: 1 }
        //         }
        //     }
        // ]).then(res => res[0] || { totalAmount: 0, totalDonations: 0 });

        // Get recent help requests
        const recentRequests = await HelpRequest.find()
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            success: true,
            stats: {
                ...stats,
                // ...donationStats
            },
            recentRequests
        });

    } catch (error) {
        console.error("getDashboardStats error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats",
            error: error.message
        });
    }
}

// Get help requests heatmap data
const getHeatmapData = async (req, res) => {
    try {
        const { status } = req.query;

        const filter = {};
        if (status) filter.status = status;

        const heatmapData = await HelpRequest.aggregate([
            {
                $match: filter
            },
            {
                $group: {
                    _id: {
                        coordinates: "$location.coordinates",
                        type: "$typeOfHelp"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    location: "$_id.coordinates",
                    type: "$_id.type",
                    weight: "$count",
                    _id: 0
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            heatmapData
        });

    } catch (error) {
        console.error("getHeatmapData error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching heatmap data",
            error: error.message
        });
    }
}

// Get help requests analytics
const getRequestAnalytics = async (req, res) => {
    try {
        // Get requests by type
        const requestsByType = await HelpRequest.aggregate([
            {
                $group: {
                    _id: "$typeOfHelp",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get requests by status
        const requestsByStatus = await HelpRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get daily requests count (last 7 days)
        const last7Days = await HelpRequest.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            analytics: {
                byType: requestsByType,
                byStatus: requestsByStatus,
                daily: last7Days
            }
        });

    } catch (error) {
        console.error("getRequestAnalytics error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching request analytics",
            error: error.message
        });
    }
}

// Get volunteer performance metrics
const getVolunteerMetrics = async (req, res) => {
    try {
        const volunteerStats = await HelpRequest.aggregate([
            {
                $match: {
                    assignedVolunteer: { $exists: true }
                }
            },
            {
                $group: {
                    _id: "$assignedVolunteer",
                    totalRequests: { $sum: 1 },
                    completedRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "volunteer"
                }
            },
            {
                $unwind: "$volunteer"
            },
            {
                $project: {
                    name: "$volunteer.name",
                    totalRequests: 1,
                    completedRequests: 1,
                    completionRate: {
                        $multiply: [
                            { $divide: ["$completedRequests", "$totalRequests"] },
                            100
                        ]
                    }
                }
            },
            {
                $sort: { completedRequests: -1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            volunteerStats
        });

    } catch (error) {
        console.error("getVolunteerMetrics error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching volunteer metrics",
            error: error.message
        });
    }
}

// Update help request status (admin override)
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedVolunteer, adminNotes } = req.body;

        const helpRequest = await HelpRequest.findByIdAndUpdate(
            id,
            {
                $set: {
                    status,
                    ...(assignedVolunteer && { assignedVolunteer }),
                    ...(adminNotes && { adminNotes })
                }
            },
            { new: true }
        )
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name');

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: "Help request not found"
            });
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('helpRequestUpdated', helpRequest);
        }

        return res.status(200).json({
            success: true,
            message: "Help request updated successfully",
            helpRequest
        });

    } catch (error) {
        console.error("updateRequestStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating request status",
            error: error.message
        });
    }
}

// Get system audit logs (basic version)
const getAuditLogs = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;

        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (type) filter.type = type;

        // This assumes you have an AuditLog model
        // You'll need to create this and log events
        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({
            success: true,
            logs
        });

    } catch (error) {
        console.error("getAuditLogs error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching audit logs",
            error: error.message
        });
    }
}

// Get all users with filters
const getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;

        const filter = {};
        if (role) filter.role = role;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(filter)
            .select("name email phone role address avatar location createdAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message
        });
    }
}

// Create user account by admin
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, phone, address } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and role are required"
            });
        }

        if (!["volunteer", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Admin can only create volunteer or admin users"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phone: phone || "",
            address: address || ""
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: createdUser
        });
    } catch (error) {
        console.error("createUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating user",
            error: error.message
        });
    }
}

// Update user details (by admin)
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const allowedUpdates = ["name", "email", "phone", "address", "avatar", "role", "location"];
        const updates = {};

        allowedUpdates.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.role && !["victim", "volunteer", "admin"].includes(updates.role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        if (updates.role === "victim") {
            const currentUser = await User.findById(userId).select("role");

            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (currentUser.role !== "victim") {
                return res.status(400).json({
                    success: false,
                    message: "Admin cannot assign victim role"
                });
            }
        }

        if (updates.email) {
            const existingUser = await User.findOne({
                email: updates.email,
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email already exists"
                });
            }
        }

        if (updates.location?.coordinates) {
            updates.location = {
                type: "Point",
                coordinates: updates.location.coordinates
            };
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        });
    } catch (error) {
        console.error("updateUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating user",
            error: error.message
        });
    }
}

// Get detailed volunteer list with statistics
const getDetailedVolunteers = async (req, res) => {
    try {
        const volunteers = await User.find({ role: "volunteer" })
            .select("name email phone address avatar location createdAt")
            .sort({ createdAt: -1 });

        // Get volunteer statistics
        const volunteerStats = await HelpRequest.aggregate([
            {
                $match: {
                    assignedVolunteer: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: "$assignedVolunteer",
                    totalRequests: { $sum: 1 },
                    completedRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    },
                    pendingRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                        }
                    },
                    acceptedRequests: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "accepted"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Map stats to volunteers
        const volunteersWithStats = volunteers.map((volunteer) => {
            const stats = volunteerStats.find(
                (stat) => stat._id.toString() === volunteer._id.toString()
            ) || { totalRequests: 0, completedRequests: 0, pendingRequests: 0, acceptedRequests: 0 };

            return {
                ...volunteer.toObject(),
                stats: {
                    totalRequests: stats.totalRequests || 0,
                    completedRequests: stats.completedRequests || 0,
                    pendingRequests: stats.pendingRequests || 0,
                    acceptedRequests: stats.acceptedRequests || 0,
                    completionRate: stats.totalRequests
                        ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
                        : 0
                }
            };
        });

        return res.status(200).json({
            success: true,
            count: volunteersWithStats.length,
            volunteers: volunteersWithStats
        });

    } catch (error) {
        console.error("getDetailedVolunteers error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching volunteers",
            error: error.message
        });
    }
}

// Update user role (by admin)
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!["victim", "volunteer", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        if (role === "victim") {
            const currentUser = await User.findById(userId).select("role");

            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (currentUser.role !== "victim") {
                return res.status(400).json({
                    success: false,
                    message: "Admin cannot assign victim role"
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select("name email phone role");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User role updated successfully",
            user
        });

    } catch (error) {
        console.error("updateUserRole error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating user role",
            error: error.message
        });
    }
}

// Deactivate user (soft delete by marking inactive)
const deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // You may want to add an 'active' or 'status' field to user model
        // For now, we'll just delete the user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deactivated successfully"
        });

    } catch (error) {
        console.error("deactivateUser error:", error);
        return res.status(500).json({
            success: false,
            message: "Error deactivating user",
            error: error.message
        });
    }
}

export {
    adminLogin,
    getDashboardStats,
    getHeatmapData,
    getRequestAnalytics,
    getVolunteerMetrics,
    updateRequestStatus,
    getAuditLogs,
    getAllUsers,
    createUser,
    updateUser,
    getDetailedVolunteers,
    updateUserRole,
    deactivateUser
}
