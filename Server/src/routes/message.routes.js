import { Router } from "express";
import { postMessage, getMessagesByConversation, markSeen } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:conversationId", verifyJWT, postMessage);
router.get("/:conversationId", verifyJWT, getMessagesByConversation);
router.post("/:conversationId/seen", verifyJWT, markSeen);

export default router;
