import { HelpRequest } from "../models/helpRequest.model.js";
import { Conversation } from "../models/conversation.model.js";

// Helper to generate a unique CASE code
const generateCaseCode = async () => {
    const prefix = "CASE";
    for (let i = 0; i < 6; i++) {
        const code = prefix + Math.floor(100000 + Math.random() * 900000).toString();
        const exists = await Conversation.findOne({ caseCode: code });
        if (!exists) return code;
    }
    // fallback using timestamp
    return prefix + Date.now().toString().slice(-6);
}

// Create a new help request
const createHelpRequest = async (req, res) => {
    console.log("📥 Incoming body:", req.body);
    try {
        const { typeOfHelp, description, contact, location, address } = req.body;

        // ✅ FIX: always extract address properly
        const finalAddress = address || location?.address;

        if (!finalAddress) {
            return res.status(400).json({
                success: false,
                message: "Address is required"
            });
        }

        const helpRequestData = {
            user: req.user?._id,
            typeOfHelp,
            description,
            contact,
            address: finalAddress
        };

        // ONLY add location if valid
        if (
            location &&
            Array.isArray(location.coordinates) &&
            location.coordinates.length === 2 &&
            location.coordinates.every(num => typeof num === "number" && !isNaN(num))
        ) {
            helpRequestData.location = {
                type: "Point",
                coordinates: location.coordinates
            };
        }
        // If no coordinates, don't add location field at all - it will break the geospatial index

        const helpRequest = await HelpRequest.create(helpRequestData);
        console.log("✅ Help request created:", helpRequest._id);

        // Create a conversation for this help request
        try {
            console.log("✏️ Creating conversation...");
            const caseCode = await generateCaseCode();
            const conv = await Conversation.create({
                helpRequest: helpRequest._id,
                victimId: helpRequest.user || null,
                location: helpRequest.location,
                caseCode,
            });
            console.log("✅ Conversation created:", conv._id, "Case code:", caseCode);

            // Emit socket event for real-time updates
            const io = req.app.get('io');
            const userSockets = req.app.get('userSockets');
            if (io) {
                io.emit('helpRequestCreated', { helpRequest, conversation: conv });
                // Auto-join the victim's connected sockets to the conversation room so they receive messages
                try {
                    const victimId = helpRequest.user;
                    if (victimId && userSockets) {
                        const set = userSockets.get(victimId.toString());
                        if (set) {
                            for (const sid of set) {
                                const s = io.sockets.sockets.get(sid);
                                if (s) {
                                    s.join(conv._id.toString());
                                    console.log(`Auto-joined victim socket ${sid} to conv ${conv._id}`);
                                }
                            }
                        }
                    }
                } catch (joinErr) {
                    console.error('Error auto-joining victim sockets to conversation:', joinErr);
                }
            }
        } catch (convErr) {
            console.error('❌ Error creating conversation for help request', convErr);
        }

        return res.status(201).json({
            success: true,
            message: "Help request created successfully",
            helpRequest
        });

    } catch (error) {
        console.error("❌ createHelpRequest error:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating help request",
            error: error.message
        });
    }
}

// Get all help requests (with filters)
const getHelpRequests = async (req, res) => {
    try {
        const { status, type } = req.query;

        const filter = {};
        if (req.user?.role === "victim") filter.user = req.user._id;
        if (status) filter.status = status;
        if (type) filter.typeOfHelp = type;

        const helpRequests = await HelpRequest.find(filter)
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: helpRequests.length,
            helpRequests
        });

    } catch (error) {
        console.error("getHelpRequests error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching help requests",
            error: error.message
        });
    }
}

const buildVolunteerAvailabilityFilter = (userId) => {
    const filter = {
        status: "pending",
        $or: [
            { assignedVolunteer: { $exists: false } },
            { assignedVolunteer: null }
        ]
    };

    if (userId) {
        filter.rejectedBy = { $ne: userId };
    }

    return filter;
};

// Get nearby help requests using geospatial query. If coordinates are not available,
// return open pending requests so volunteers still have actionable work.
const getNearbyRequests = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // radius in meters, default 5km

        const filter = buildVolunteerAvailabilityFilter(req.user?._id);

        const hasCoordinates = lat && lng;

        if (hasCoordinates) {
            filter.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            };
        }

        const query = HelpRequest.find(filter)
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name')
            .limit(50);

        if (!hasCoordinates) {
            query.sort({ createdAt: -1 });
        }

        const helpRequests = await query;

        return res.status(200).json({
            success: true,
            count: helpRequests.length,
            helpRequests
        });

    } catch (error) {
        console.error("getNearbyRequests error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching nearby requests",
            error: error.message
        });
    }
}

// Get single help request by ID
const getHelpRequestById = async (req, res) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id)
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name');

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: "Help request not found"
            });
        }

        return res.status(200).json({
            success: true,
            helpRequest
        });

    } catch (error) {
        console.error("getHelpRequestById error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching help request",
            error: error.message
        });
    }
}

// Update help request (status/volunteer assignment)
const updateHelpRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedVolunteer, volunteerNotes } = req.body;

        // Only allow specific status transitions
        const allowedStatus = ["pending", "accepted", "in_progress", "completed", "cancelled"];
        if (status && !allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        // If updating to accepted, must provide volunteer
        if (status === "accepted" && !assignedVolunteer) {
            return res.status(400).json({
                success: false,
                message: "Volunteer required when accepting request"
            });
        }

        const requestedVolunteer = assignedVolunteer || req.user?._id;
        const updateFields = {};

        if (status) updateFields.status = status;
        if (assignedVolunteer) updateFields.assignedVolunteer = assignedVolunteer;
        if (volunteerNotes !== undefined) updateFields.volunteerNotes = volunteerNotes;
        if (status === "accepted") updateFields.acceptedAt = new Date();
        if (status === "in_progress") updateFields.reachedAt = new Date();
        if (status === "completed") updateFields.completedAt = new Date();
        if (status === "cancelled") updateFields.cancelledAt = new Date();

        const filter = {
            _id: id,
            ...(status === "accepted"
                ? { status: "pending" }
                : req.user?.role === "admin"
                    ? {}
                    : { assignedVolunteer: requestedVolunteer })
        };

        // Update atomically (ensure no race conditions)
        const helpRequest = await HelpRequest.findOneAndUpdate(
            filter,
            { $set: updateFields },
            { new: true }
        ).populate('user', 'name')
            .populate('assignedVolunteer', 'name');

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: status === "accepted"
                    ? "Help request not found or already accepted"
                    : "Help request not found or not assigned to you"
            });
        }

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('helpRequestUpdated', helpRequest);
        }

        // If request accepted, also link/update the Conversation record so the volunteer sees it
        if (status === 'accepted' && assignedVolunteer) {
            try {
                console.log('🔁 Linking conversation to volunteer:', assignedVolunteer);
                const conv = await Conversation.findOneAndUpdate(
                    { helpRequest: helpRequest._id },
                    { $set: { volunteerId: assignedVolunteer, updatedAt: new Date() } },
                    { new: true }
                );

                if (conv && io) {
                    io.to(conv._id.toString()).emit('conversationUpdated', conv);
                    // Also emit a global event so the assigned volunteer (if connected) can refresh
                    io.emit('helpRequestAccepted', { helpRequest, conversation: conv });
                    try {
                        const userSockets = req.app.get('userSockets');
                        // auto-join assigned volunteer sockets to the conversation room
                        if (assignedVolunteer && userSockets) {
                            const set = userSockets.get(assignedVolunteer.toString());
                            if (set) {
                                for (const sid of set) {
                                    const s = io.sockets.sockets.get(sid);
                                    if (s) {
                                        s.join(conv._id.toString());
                                        console.log(`Auto-joined volunteer socket ${sid} to conv ${conv._id}`);
                                    }
                                }
                            }
                        }
                        // also ensure victim sockets are joined
                        const victimId = helpRequest.user?._id || helpRequest.user;
                        if (victimId && userSockets) {
                            const setV = userSockets.get(victimId.toString());
                            if (setV) {
                                for (const sid of setV) {
                                    const s = io.sockets.sockets.get(sid);
                                    if (s) {
                                        s.join(conv._id.toString());
                                        console.log(`Auto-joined victim socket ${sid} to conv ${conv._id}`);
                                    }
                                }
                            }
                        }
                    } catch (joinErr) {
                        console.error('Error auto-joining sockets to conversation on accept:', joinErr);
                    }
                }
            } catch (err) {
                console.error('Error linking conversation to volunteer:', err);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Help request updated successfully",
            helpRequest
        });

    } catch (error) {
        console.error("updateHelpRequest error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating help request",
            error: error.message
        });
    }
}

// Reject/skip a pending request for the current volunteer without cancelling it globally
const rejectHelpRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const helpRequest = await HelpRequest.findOneAndUpdate(
            { _id: id, status: "pending" },
            { $addToSet: { rejectedBy: req.user._id } },
            { new: true }
        )
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name');

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: "Help request not found or no longer pending"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Help request rejected for this volunteer",
            helpRequest
        });
    } catch (error) {
        console.error("rejectHelpRequest error:", error);
        return res.status(500).json({
            success: false,
            message: "Error rejecting help request",
            error: error.message
        });
    }
}

// Admin update for full help request editing
const adminUpdateHelpRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedStatus = ["pending", "accepted", "in_progress", "completed", "cancelled"];
        const allowedTypes = ["food", "water", "medical", "shelter", "rescue", "other"];
        const updates = {};

        const editableFields = ["typeOfHelp", "description", "contact", "address", "status", "assignedVolunteer", "volunteerNotes"];
        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.typeOfHelp && !allowedTypes.includes(updates.typeOfHelp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid help type"
            });
        }

        if (updates.status && !allowedStatus.includes(updates.status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        if (req.body.location?.coordinates) {
            updates.location = {
                type: "Point",
                coordinates: req.body.location.coordinates
            };
        }

        const hasAssignedVolunteer = Object.prototype.hasOwnProperty.call(req.body, "assignedVolunteer");

        if (updates.assignedVolunteer === "") {
            updates.assignedVolunteer = undefined;
        }

        if (updates.status === "pending" || (hasAssignedVolunteer && updates.assignedVolunteer === undefined)) {
            delete updates.assignedVolunteer;
        }

        if (updates.status === "accepted" && req.body.assignedVolunteer) {
            updates.acceptedAt = new Date();
        }

        if (updates.status === "in_progress") {
            updates.reachedAt = new Date();
        }

        if (updates.status === "completed") {
            updates.completedAt = new Date();
        }

        if (updates.status === "cancelled") {
            updates.cancelledAt = new Date();
        }

        const updateOperation = { $set: updates };

        if (updates.status === "pending" || (hasAssignedVolunteer && !req.body.assignedVolunteer)) {
            updateOperation.$unset = { assignedVolunteer: "" };
        }

        const helpRequest = await HelpRequest.findByIdAndUpdate(
            id,
            updateOperation,
            { new: true, runValidators: true }
        )
            .populate('user', 'name')
            .populate('assignedVolunteer', 'name');

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: "Help request not found"
            });
        }

        if (req.body.assignedVolunteer) {
            await Conversation.findOneAndUpdate(
                { helpRequest: helpRequest._id },
                { $set: { volunteerId: req.body.assignedVolunteer, updatedAt: new Date() } }
            );
        }

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
        console.error("adminUpdateHelpRequest error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating help request",
            error: error.message
        });
    }
}

// Admin delete help request
const adminDeleteHelpRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const helpRequest = await HelpRequest.findByIdAndDelete(id);

        if (!helpRequest) {
            return res.status(404).json({
                success: false,
                message: "Help request not found"
            });
        }

        await Conversation.deleteMany({ helpRequest: id });

        const io = req.app.get('io');
        if (io) {
            io.emit('helpRequestDeleted', { _id: id });
        }

        return res.status(200).json({
            success: true,
            message: "Help request deleted successfully"
        });
    } catch (error) {
        console.error("adminDeleteHelpRequest error:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting help request",
            error: error.message
        });
    }
}

// Get my help requests (as victim)
const getMyHelpRequests = async (req, res) => {
    try {
        const helpRequests = await HelpRequest.find({ user: req.user._id })
            .populate('assignedVolunteer', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: helpRequests.length,
            helpRequests
        });

    } catch (error) {
        console.error("getMyHelpRequests error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching your help requests",
            error: error.message
        });
    }
}

// Get requests I'm helping with (as volunteer)
const getMyAssignedRequests = async (req, res) => {
    try {
        const helpRequests = await HelpRequest.find({
            assignedVolunteer: req.user._id,
            status: { $in: ["accepted", "in_progress", "completed", "cancelled"] }
        })
            .populate('user', 'name')
            .sort({ acceptedAt: -1 });

        return res.status(200).json({
            success: true,
            count: helpRequests.length,
            helpRequests
        });

    } catch (error) {
        console.error("getMyAssignedRequests error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching assigned requests",
            error: error.message
        });
    }
}


export {
    createHelpRequest,
    getHelpRequests,
    getNearbyRequests,
    getHelpRequestById,
    updateHelpRequest,
    rejectHelpRequest,
    adminUpdateHelpRequest,
    adminDeleteHelpRequest,
    getMyHelpRequests,
    getMyAssignedRequests
}
