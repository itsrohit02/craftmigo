import { Router } from "express";
import { getContactSettings } from "../controllers/settings.controller.js";

const router = Router();

router.get("/contact", getContactSettings);

export default router;
