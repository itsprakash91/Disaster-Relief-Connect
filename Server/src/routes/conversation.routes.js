import { Router } from "express";
import { createConversation, getConversationByHelpRequest, getConversationsForUser, createDirectConversation } from "../controllers/conversation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, createConversation);
router.post("/with-volunteer", verifyJWT, createDirectConversation);
router.get("/help-request/:helpRequestId", verifyJWT, getConversationByHelpRequest);
router.get("/me", verifyJWT, getConversationsForUser);

export default router;
