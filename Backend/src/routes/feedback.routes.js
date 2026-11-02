import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createFeedback } from "../controllers/feedback.controller.js";

const router = Router();

router.post("/", verifyJWT, createFeedback);

export default router;
