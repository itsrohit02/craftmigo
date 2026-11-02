import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { messageLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  startOrGetConversation,
  listConversations,
  getMessages,
  sendMessage,
  updateMessageRequest,
} from "../controllers/message.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/conversations", listConversations);
router.post("/conversations", startOrGetConversation);
router.get("/conversations/:id", getMessages);
router.post("/conversations/:id", messageLimiter, sendMessage);
router.patch("/conversations/:id/request", updateMessageRequest);

export default router;
