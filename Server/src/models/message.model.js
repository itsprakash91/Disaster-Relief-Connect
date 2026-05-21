import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        senderPhone: {
            type: String,
            default: "",
        },
        senderRole: {
            type: String,
            enum: ["victim", "volunteer", "admin"],
            required: true,
        },
        text: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["text", "image", "system"],
            default: "text",
        },
        seenBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
