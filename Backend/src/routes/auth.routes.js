import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  resendEmailVerificationCode,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  forgotPasswordEmailLimiter,
  forgotPasswordIpLimiter,
  emailVerificationAttemptEmailLimiter,
  emailVerificationAttemptLimiter,
  emailVerificationRequestEmailLimiter,
  emailVerificationRequestIpLimiter,
  loginLimiter,
  passwordResetLimiter,
  passwordResetEmailLimiter,
  refreshTokenLimiter,
  registrationLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", registrationLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/resend-verification", emailVerificationRequestIpLimiter, emailVerificationRequestEmailLimiter, resendEmailVerificationCode);
router.post("/verify-email", emailVerificationAttemptLimiter, emailVerificationAttemptEmailLimiter, verifyEmail);
router.post("/forgot-password", forgotPasswordIpLimiter, forgotPasswordEmailLimiter, requestPasswordReset);
router.patch("/reset-password", passwordResetLimiter, passwordResetEmailLimiter, resetPassword);
router.post("/refresh", refreshTokenLimiter, refreshAccessToken);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/change-password", verifyJWT, changePassword);

export default router;
