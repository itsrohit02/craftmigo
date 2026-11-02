import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload, validateImageUploads } from "../middlewares/upload.middleware.js";
import {
  updateProfile,
  updateAvatar,
  addFavoriteService,
  removeFavoriteService,
  addFavoriteWorker,
  removeFavoriteWorker,
  getFavorites,
} from "../controllers/user.controller.js";

const router = Router();

router.use(verifyJWT);

router.patch("/profile", updateProfile);
router.patch("/avatar", upload.single("avatar"), validateImageUploads, updateAvatar);

router.get("/favorites", getFavorites);
router.post("/favorites/services/:serviceId", addFavoriteService);
router.delete("/favorites/services/:serviceId", removeFavoriteService);
router.post("/favorites/workers/:workerId", addFavoriteWorker);
router.delete("/favorites/workers/:workerId", removeFavoriteWorker);

export default router;
