import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
  createReview,
  getWorkerReviews,
  getMyReviews,
  moderateReview,
} from "../controllers/review.controller.js";

const router = Router();

router.get("/worker/:workerId", getWorkerReviews);

router.post("/", verifyJWT, authorizeRoles("user", "worker"), createReview);
router.get("/me", verifyJWT, authorizeRoles("user", "worker"), getMyReviews);
router.patch("/:id/moderate", verifyJWT, authorizeRoles("admin"), moderateReview);

export default router;
