import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// Post a message to a conversation
const postMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { text, type = "text" } = req.body;

    if (!conversationId) throw new ApiError(400, "conversationId required");

    const conv = await Conversation.findById(conversationId)
        .populate("victimId", "name email phone")
        .populate("volunteerId", "name email phone");
    if (!conv) throw new ApiError(404, "Conversation not found");

    const message = await Message.create({
        conversationId,
        senderId: req.user._id,
        senderRole: req.user.role,
        text: text || "",
        type,
    });

    // Populate sender details for socket emission
    const populatedMessage = await message.populate("senderId", "name email phone");

    console.log('✉️ Message created:', { id: message._id, conversationId, senderId: req.user._id });

    // Update conversation updatedAt so lists sort correctly
    conv.updatedAt = new Date();
    await conv.save();

    // Emit socket events
    const io = req.app.get("io");

    if (io) {
        // 1. Emit to conversation room (for people already in the chat)
        io.to(conversationId.toString()).emit("newMessage", populatedMessage);
        console.log(`📨 Emitted newMessage to conversation room ${conversationId}`);

        // 2. Emit conversationUpdated to both participants via their user rooms
        const victimId = conv.victimId?._id?.toString();
        const volunteerId = conv.volunteerId?._id?.toString();

        if (victimId) {
            io.to(victimId).emit("conversationUpdated", conv);
            console.log(`📢 Emitted conversationUpdated to victim user room ${victimId}`);
        }

        if (volunteerId) {
            io.to(volunteerId).emit("conversationUpdated", conv);
            console.log(`📢 Emitted conversationUpdated to volunteer user room ${volunteerId}`);
        }
    }

    return res.status(201).json({ success: true, message: populatedMessage });
});// Get messages for a conversation
const getMessagesByConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    if (!conversationId) throw new ApiError(400, "conversationId required");

    const messages = await Message.find({ conversationId })
        .populate("senderId", "name email phone")
        .sort({ createdAt: 1 })
        .limit(1000);

    return res.status(200).json({ success: true, count: messages.length, messages });
});

// Mark messages as seen in a conversation
const markSeen = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!conversationId) throw new ApiError(400, "conversationId required");

    await Message.updateMany(
        { conversationId, seenBy: { $ne: userId } },
        { $addToSet: { seenBy: userId } }
    );

    return res.status(200).json({ success: true, message: "Marked as seen" });
});

export { postMessage, getMessagesByConversation, markSeen };
