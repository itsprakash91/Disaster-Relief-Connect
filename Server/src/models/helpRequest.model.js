import mongoose, { Schema } from "mongoose";

const helpRequestSchema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        },

        typeOfHelp: {
            type: String,
            enum: ["food", "water", "medical", "shelter", "rescue", "other"],
            required: true
        },

        description: {
            type: String,
            required: true
        },

        contact: {
            type: String,
            required: true,
            match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
        },

        address: {
            type: String,
            required: true
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
            },
            coordinates: {
                type: [Number],
            }
        },

        source: {
            type: String,
            enum: ["web", "SMS-based"],
            default: "web"
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
            default: "pending"
        },

        assignedVolunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        rejectedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        volunteerNotes: {
            type: String,
            trim: true,
            default: ""
        },

        acceptedAt: Date,
        reachedAt: Date,
        completedAt: Date,
        cancelledAt: Date,

    }, { timestamps: true }
);

// IMPORTANT: only works when valid location present
helpRequestSchema.index({ location: "2dsphere" });

export const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
