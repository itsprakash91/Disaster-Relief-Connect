import mongoose, { Schema } from "mongoose";

const campSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter camp name"],
            trim: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        address: {
            type: String,
            required: [true, "Please enter camp address"],
        },
        capacity: {
            type: Number,
            required: [true, "Please enter camp capacity"],
            min: 1,
        },
        occupancy: {
            type: Number,
            default: 0,
            min: 0,
        },
        contact: {
            type: String,
            required: [true, "Please enter contact number"],
            trim: true,
        },
        coordinator: {
            type: String, // Name of camp coordinator
            default: "",
        },
        resources: {
            food: { type: Number, default: 0 },
            water: { type: Number, default: 0 },
            medical: { type: Number, default: 0 },
            shelter: { type: Number, default: 0 },
        },
        status: {
            type: String,
            enum: ["Active", "Closed", "Full"],
            default: "Active",
        },
        description: {
            type: String,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Create geospatial index for location-based queries
campSchema.index({ "location": "2dsphere" });

export const Camp = mongoose.model("Camp", campSchema);
