import { Conversation } from "../models/conversation.model.js";
import { HelpRequest } from "../models/helpRequest.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

// Create conversation (optional - helpRequest creation already auto-creates)
const createConversation = asyncHandler(async (req, res) => {
    const { helpRequestId, volunteerId } = req.body;

    if (!helpRequestId) throw new ApiError(400, "helpRequestId is required");

    const helpRequest = await HelpRequest.findById(helpRequestId);
    if (!helpRequest) throw new ApiError(404, "Help request not found");

    const existing = await Conversation.findOne({ helpRequest: helpRequestId });
    if (existing) {
        return res.status(200).json({ success: true, conversation: existing });
    }

    const conv = await Conversation.create({
        helpRequest: helpRequestId,
        victimId: helpRequest.user || null,
        volunteerId: volunteerId || null,
        location: helpRequest.location,
    });

    return res.status(201).json({ success: true, conversation: conv });
});

// Get conversation by helpRequest id
const getConversationByHelpRequest = asyncHandler(async (req, res) => {
    const { helpRequestId } = req.params;
    const conv = await Conversation.findOne({ helpRequest: helpRequestId })
        .populate("victimId", "name phone")
        .populate("volunteerId", "name phone");

    if (!conv) throw new ApiError(404, "Conversation not found");

    return res.status(200).json({ success: true, conversation: conv });
});

// Get conversations for logged-in user
const getConversationsForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log("📍 Getting conversations for user:", userId);

    const convs = await Conversation.find({
        $or: [{ victimId: userId }, { volunteerId: userId }],
    })
        .populate("victimId", "name")
        .populate("volunteerId", "name")
        .sort({ updatedAt: -1 })
        .limit(100);

    console.log("📊 Found conversations:", convs.length);
    console.log("📄 Conversation data:", JSON.stringify(convs, null, 2));

    return res.status(200).json({ success: true, count: convs.length, conversations: convs });
});

// Create direct conversation between two users (without help request)
// This supports both flows:
// - victim (authenticated) starts chat with a volunteer -> send { volunteerId }
// - volunteer (authenticated) starts chat with a victim -> send { victimId }
const createDirectConversation = asyncHandler(async (req, res) => {
    const actorId = req.user._id;
    const actorRole = req.user.role;
    let victimId = null;
    let volunteerId = null;

    console.log("📥 createDirectConversation called by:", actorId.toString(), "role:", actorRole);
    console.log("📥 Request body:", req.body);

    // tolerate raw body id (axios might send a primitive in some calls)
    const body = req.body;
    if (typeof body === "string" || typeof body === "number") {
        // if actor is victim, treat raw body as volunteerId; if volunteer, as victimId
        if (actorRole === "victim") volunteerId = String(body);
        else if (actorRole === "volunteer") victimId = String(body);
    }

    // Determine participants based on provided payload and authenticated user
    // Accept forms:
    // - both `victimId` and `volunteerId` in body
    // - only `volunteerId` (then victim is actor)
    // - only `victimId` (then volunteer is actor)
    const bodyVictim = req.body?.victimId || req.body?.victim || req.body?.victim?._id;
    const bodyVolunteer = req.body?.volunteerId || req.body?.volunteer || req.body?.volunteer?._id;

    // prefer explicit both
    if (bodyVictim && bodyVolunteer) {
        victimId = bodyVictim;
        volunteerId = bodyVolunteer;
    } else if (bodyVolunteer && !bodyVictim) {
        // caller provided volunteerId only -> victim is actor
        volunteerId = bodyVolunteer;
        victimId = actorId;
    } else if (bodyVictim && !bodyVolunteer) {
        // caller provided victimId only -> volunteer is actor
        victimId = bodyVictim;
        volunteerId = actorId;
    } else if (typeof body === "string" || typeof body === "number") {
        // raw id sent
        if (actorRole === "victim") {
            volunteerId = String(body);
            victimId = actorId;
        } else if (actorRole === "volunteer") {
            victimId = String(body);
            volunteerId = actorId;
        }
    }

    // final validation
    if (!victimId || !volunteerId) {
        console.error("❌ Missing participant IDs. actor:", actorId.toString(), "role:", actorRole, "body:", req.body);
        throw new ApiError(400, "victimId and volunteerId are required to create a direct conversation");
    }

    // Normalize to strings for lookups
    const victimIdStr = victimId.toString();
    const volunteerIdStr = volunteerId.toString();

    // Check if conversation already exists between these two users
    const existing = await Conversation.findOne({
        victimId: victimIdStr,
        volunteerId: volunteerIdStr,
        helpRequest: null, // Only direct conversations
    });

    if (existing) {
        console.log("✅ Direct conversation already exists:", existing._id);
        return res.status(200).json({ success: true, conversation: existing });
    }

    // Create new direct conversation
    const conv = await Conversation.create({
        victimId: victimIdStr,
        volunteerId: volunteerIdStr,
        helpRequest: null,
        location: null,
    });

    console.log("✅ Direct conversation created:", conv._id);

    // Auto-join both users' sockets to the conversation room
    const { userSockets } = global;
    if (userSockets) {
        const victimSockets = userSockets.get(victimIdStr);
        const volunteerSockets = userSockets.get(volunteerIdStr);

        if (victimSockets) {
            victimSockets.forEach(socketId => {
                const socket = global.io?.sockets?.sockets?.get(socketId);
                if (socket) {
                    socket.join(conv._id.toString());
                    console.log(`🔗 Victim socket ${socketId} joined conversation room`);
                }
            });
        }

        if (volunteerSockets) {
            volunteerSockets.forEach(socketId => {
                const socket = global.io?.sockets?.sockets?.get(socketId);
                if (socket) {
                    socket.join(conv._id.toString());
                    console.log(`🔗 Volunteer socket ${socketId} joined conversation room`);
                }
            });
        }
    }

    return res.status(201).json({ success: true, conversation: conv });
});

export { createConversation, getConversationByHelpRequest, getConversationsForUser, createDirectConversation };
