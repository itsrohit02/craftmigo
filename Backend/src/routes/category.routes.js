import { Router } from "express";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", listCategories);

router.post("/", verifyJWT, authorizeRoles("admin"), createCategory);
router.patch("/:id", verifyJWT, authorizeRoles("admin"), updateCategory);
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteCategory);

export default router;
