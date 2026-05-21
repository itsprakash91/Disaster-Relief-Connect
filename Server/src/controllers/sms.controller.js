import { Conversation } from "../models/conversation.model.js";
import { HelpRequest } from "../models/helpRequest.model.js";
import { Message } from "../models/message.model.js";
import twilio from "twilio";
import { asyncHandler } from "../utils/asyncHandler.js";

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilioAccountSid && twilioAuthToken ? twilio(twilioAccountSid, twilioAuthToken) : null;

const DEFAULT_REPLY = "Your request has been received. Help will reach you soon.";

function normalizeContactNumber(rawNumber) {
    if (!rawNumber) return "";
    const digits = rawNumber.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }
    if (digits.length === 10) {
        return digits;
    }
    return digits;
}

function inferHelpType(text) {
    const lower = text.toLowerCase();
    if (/\b(rescue|save|evacuate|stranded)\b/.test(lower)) return "rescue";
    if (/\b(food|meal|ration|hunger)\b/.test(lower)) return "food";
    if (/\b(water|drink|hydration)\b/.test(lower)) return "water";
    if (/\b(medical|doctor|medicine|injury|health)\b/.test(lower)) return "medical";
    if (/\b(shelter|roof|home|house|cover)\b/.test(lower)) return "shelter";
    return "other";
}

function parseHelpSms(body) {
    const text = body.trim();
    const match = text.match(/^HELP\s+(.+)$/i);
    if (!match) return null;

    const payload = match[1].trim();
    const parts = payload.split(/\s+/);
    if (parts.length < 3) return null;

    const name = parts[0].trim();
    const location = parts[1].trim();
    const description = parts.slice(2).join(" ").trim();

    if (!name || !location || !description) {
        return null;
    }

    return { name, location, description };
}

async function sendTwilioReply(to, text) {
    if (!twilioClient || !twilioPhoneNumber) {
        console.warn("Twilio is not fully configured; skipping outbound SMS reply.");
        return null;
    }

    try {
        return await twilioClient.messages.create({
            body: text,
            from: twilioPhoneNumber,
            to,
        });
    } catch (error) {
        console.error("Failed to send SMS reply via Twilio:", error);
        return null;
    }
}

async function handleSmsHelpRequest(req, res, from, body) {
    const parsed = parseHelpSms(body);
    if (!parsed) {
        res.type("text/xml");
        return res.send(`<Response><Message>Invalid SMS format. Send: HELP Name City Description</Message></Response>`);
    }

    const contact = normalizeContactNumber(from) || from;
    const helpType = inferHelpType(parsed.description);

    console.log("Parsed SMS help request", {
        from,
        contact,
        name: parsed.name,
        location: parsed.location,
        description: parsed.description,
        helpType,
    });

    await HelpRequest.create({
        typeOfHelp: helpType,
        description: `Name: ${parsed.name}; Location: ${parsed.location}; Request: ${parsed.description}`,
        contact,
        location: {
            type: "Point",
            coordinates: [0, 0],
            address: parsed.location,
        },
        source: "SMS-based",
    });

    const replyText = DEFAULT_REPLY;
    const sent = await sendTwilioReply(from, replyText);

    res.type("text/xml");
    if (sent) {
        return res.send(`<Response></Response>`);
    }
    return res.send(`<Response><Message>${replyText}</Message></Response>`);
}

// Twilio-compatible webhook for incoming SMS
// Twilio sends form-url-encoded data with fields like From, Body, To
const incomingSms = asyncHandler(async (req, res) => {
    const from = req.body.From || req.body.from;
    const body = req.body.Body || req.body.body || "";

    console.log("Incoming SMS payload", { from, body, raw: req.body });

    if (!from || !body) {
        res.type("text/xml");
        return res.send(`<Response><Message>Invalid SMS data</Message></Response>`);
    }

    if (/^\s*HELP\b/i.test(body)) {
        return handleSmsHelpRequest(req, res, from, body);
    }

    const match = body.match(/CASE\s*[:#-]?\s*([A-Za-z0-9]+)/i);
    if (!match) {
        res.type("text/xml");
        return res.send(`<Response><Message>Please include your case code (e.g. CASE123456) at the start of the message.</Message></Response>`);
    }

    const caseCode = match[1].toUpperCase().startsWith("CASE") ? match[1].toUpperCase() : ("CASE" + match[1].toUpperCase());
    const conv = await Conversation.findOne({ caseCode });
    if (!conv) {
        res.type("text/xml");
        return res.send(`<Response><Message>Case code not found. Please check the code shown in your app.</Message></Response>`);
    }

    const text = body.replace(match[0], "").trim() || body.trim();

    const message = await Message.create({
        conversationId: conv._id,
        senderId: conv.victimId || undefined,
        senderPhone: from,
        senderRole: "victim",
        text,
        type: "text",
    });

    const io = req.app.get("io");
    if (io) {
        io.to(conv._id.toString()).emit("newMessage", message);
    }

    res.type("text/xml");
    return res.send(`<Response><Message>Your message has been received. Help is on the way. Case: ${caseCode}</Message></Response>`);
});

export { incomingSms };
