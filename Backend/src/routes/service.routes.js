import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload, validateImageUploads } from "../middlewares/upload.middleware.js";
import {
  listServices,
  getServiceDetails,
  getMyServices,
  createService,
  updateService,
  removeServiceImage,
  toggleServiceActive,
  deleteService,
  getServicesByWorker,
} from "../controllers/service.controller.js";

const router = Router();

// Public
router.get("/", listServices);
router.get("/worker/:workerId", getServicesByWorker);
router.get("/:id", getServiceDetails);

// Worker-only
router.get("/me/mine", verifyJWT, authorizeRoles("worker"), getMyServices);
router.post("/", verifyJWT, authorizeRoles("worker"), upload.array("images", 6), validateImageUploads, createService);
router.patch("/:id", verifyJWT, authorizeRoles("worker"), upload.array("images", 6), validateImageUploads, updateService);
router.patch("/:id/toggle-active", verifyJWT, authorizeRoles("worker"), toggleServiceActive);
router.delete("/:id/images/:publicId", verifyJWT, authorizeRoles("worker"), removeServiceImage);
router.delete("/:id", verifyJWT, authorizeRoles("worker"), deleteService);

export default router;
