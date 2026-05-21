import { Camp } from "../models/camp.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// Get all camps
const getAllCamps = asyncHandler(async (req, res) => {
    const camps = await Camp.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, { camps }, "Camps fetched successfully"));
});

// Get camp by ID
const getCampById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const camp = await Camp.findById(id).populate("createdBy", "name email");

    if (!camp) {
        throw new ApiError(404, "Camp not found");
    }

    return res.status(200).json(new ApiResponse(200, { camp }, "Camp fetched successfully"));
});

// Create new camp
const createCamp = asyncHandler(async (req, res) => {
    const { name, address, capacity, contact, coordinator, description, location } = req.body;

    if (!name || !address || !capacity || !contact || !location || !location.coordinates) {
        throw new ApiError(400, "Please provide all required fields");
    }

    const camp = new Camp({
        name,
        address,
        capacity,
        contact,
        coordinator: coordinator || "",
        description: description || "",
        location: {
            type: "Point",
            coordinates: location.coordinates, // [longitude, latitude]
        },
        createdBy: req.user._id,
    });

    await camp.save();

    return res.status(201).json(new ApiResponse(201, { camp }, "Camp created successfully"));
});

// Update camp
const updateCamp = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, address, capacity, occupancy, contact, coordinator, status, description, resources, location } = req.body;

    const camp = await Camp.findById(id);

    if (!camp) {
        throw new ApiError(404, "Camp not found");
    }

    // Update fields if provided
    if (name) camp.name = name;
    if (address) camp.address = address;
    if (capacity) camp.capacity = capacity;
    if (occupancy !== undefined) camp.occupancy = occupancy;
    if (contact) camp.contact = contact;
    if (coordinator) camp.coordinator = coordinator;
    if (status) camp.status = status;
    if (description) camp.description = description;
    if (resources) camp.resources = { ...camp.resources, ...resources };
    if (location && location.coordinates) {
        camp.location = {
            type: "Point",
            coordinates: location.coordinates,
        };
    }

    await camp.save();

    return res.status(200).json(new ApiResponse(200, { camp }, "Camp updated successfully"));
});

// Delete camp
const deleteCamp = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const camp = await Camp.findByIdAndDelete(id);

    if (!camp) {
        throw new ApiError(404, "Camp not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Camp deleted successfully"));
});

// Get camps near coordinates (location-based query)
const getCampsNearby = asyncHandler(async (req, res) => {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
        throw new ApiError(400, "Please provide longitude and latitude");
    }

    const camps = await Camp.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                },
                $maxDistance: parseInt(maxDistance) || 10000, // 10km default
            },
        },
    });

    return res.status(200).json(new ApiResponse(200, { camps }, "Nearby camps fetched successfully"));
});

// Get camp statistics
const getCampStats = asyncHandler(async (req, res) => {
    const totalCamps = await Camp.countDocuments();
    const activeCamps = await Camp.countDocuments({ status: "Active" });
    const totalCapacity = await Camp.aggregate([
        {
            $group: {
                _id: null,
                totalCapacity: { $sum: "$capacity" },
                totalOccupancy: { $sum: "$occupancy" },
            },
        },
    ]);

    const stats = totalCapacity[0] || { totalCapacity: 0, totalOccupancy: 0 };

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalCamps,
                activeCamps,
                totalCapacity: stats.totalCapacity,
                totalOccupancy: stats.totalOccupancy,
                occupancyPercentage:
                    stats.totalCapacity > 0
                        ? Math.round((stats.totalOccupancy / stats.totalCapacity) * 100)
                        : 0,
            },
            "Camp statistics fetched successfully"
        )
    );
});

export {
    getAllCamps,
    getCampById,
    createCamp,
    updateCamp,
    deleteCamp,
    getCampsNearby,
    getCampStats,
};
