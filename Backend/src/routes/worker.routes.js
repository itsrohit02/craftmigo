import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload, validateImageUploads } from "../middlewares/upload.middleware.js";
import {
  getMyWorkerProfile,
  updateMyWorkerProfile,
  toggleAvailability,
  addPortfolioItem,
  removePortfolioItem,
  submitVerification,
  getPublicWorkerProfile,
  listWorkers,
} from "../controllers/worker.controller.js";

const router = Router();

// Public
router.get("/", listWorkers);
router.get("/:id", getPublicWorkerProfile);

// Worker-only (self)
router.get("/me/profile", verifyJWT, authorizeRoles("worker"), getMyWorkerProfile);
router.patch("/me/profile", verifyJWT, authorizeRoles("worker"), updateMyWorkerProfile);
router.patch("/me/availability", verifyJWT, authorizeRoles("worker"), toggleAvailability);
router.post(
  "/me/portfolio",
  verifyJWT,
  authorizeRoles("worker"),
  upload.single("image"),
  validateImageUploads,
  addPortfolioItem
);
router.delete("/me/portfolio/:itemId", verifyJWT, authorizeRoles("worker"), removePortfolioItem);
router.post(
  "/me/verification",
  verifyJWT,
  authorizeRoles("worker"),
  upload.array("documents", 5),
  validateImageUploads,
  submitVerification
);

export default router;
