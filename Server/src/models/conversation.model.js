import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
    {
        helpRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HelpRequest",
            // optional: direct conversations won't have an associated help request
        },
        caseCode: {
            type: String,
            // unique: true,
            // index: true,
        },
        victimId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        volunteerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["open", "closed", "escalated"],
            default: "open",
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [lng, lat]
            },
            address: String,
        },
    },
    { timestamps: true }
);

// yaha indexes
conversationSchema.index(
    { caseCode: 1 },
    { unique: true, partialFilterExpression: { caseCode: { $exists: true, $ne: null } } }
);

conversationSchema.index(
    { helpRequest: 1 },
    { unique: true, partialFilterExpression: { helpRequest: { $exists: true, $ne: null } } }
);
export const Conversation = mongoose.model("Conversation", conversationSchema);

// Ensure a unique index only for conversations that have a helpRequest set.
// This allows multiple direct conversations with `helpRequest: null` while
// keeping the previous uniqueness constraint for helpRequest-linked conversations.
// yaha indexes