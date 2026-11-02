import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;
