import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
  getDashboardStats,
  listUsers,
  blockUser,
  unblockUser,
  deleteUser,
  listPendingVerifications,
  getVerificationDocument,
  verifyWorker,
  blockWorker,
  unblockWorker,
  listAllBookings,
  listPayments,
  listAllReviews,
} from "../controllers/admin.controller.js";
import { updateContactSettings } from "../controllers/settings.controller.js";
import { listFeedback, updateFeedbackStatus } from "../controllers/feedback.controller.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("admin"));

router.get("/dashboard", getDashboardStats);
router.put("/settings/contact", updateContactSettings);
router.get("/feedback", listFeedback);
router.patch("/feedback/:id/status", updateFeedbackStatus);

router.get("/users", listUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.delete("/users/:id", deleteUser);

router.get("/workers/pending-verification", listPendingVerifications);
router.get("/workers/:userId/verification-documents/:documentId", getVerificationDocument);
router.patch("/workers/:userId/verify", verifyWorker);
router.patch("/workers/:userId/block", blockWorker);
router.patch("/workers/:userId/unblock", unblockWorker);

router.get("/bookings", listAllBookings);
router.get("/payments", listPayments);
router.get("/reviews", listAllReviews);

export default router;
