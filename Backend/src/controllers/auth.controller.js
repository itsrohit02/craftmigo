import jwt from "jsonwebtoken";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import validator from "validator";
import { sendEmailVerificationCode, sendPasswordResetEmail } from "../config/mailer.js";
import {
  registerUser,
  loginWithCredentials,
  generateTokens,
} from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

const tokenCookieOptions = (token) => {
  const payload = jwt.decode(token);
  if (!payload || typeof payload !== "object" || typeof payload.exp !== "number") {
    throw new Error("Generated authentication token is missing its expiration");
  }

  return {
    ...cookieOptions,
    maxAge: Math.max(0, payload.exp * 1000 - Date.now()),
  };
};

const createEmailVerificationCode = async (user) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.emailVerificationToken = crypto.createHash("sha256").update(otp).digest("hex");
  user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmailVerificationCode({ email: user.email, name: user.name, otp });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Email verification delivery failed:", error.code || "SMTP error");
    throw new ApiError(503, "Your account was created, but the verification email could not be sent. Please try resending the code.");
  }
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (typeof email !== "string" || !validator.isEmail(email.trim())) {
    throw new ApiError(400, "Please provide a valid email address");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await registerUser({ name, email, password, phone, role });
  await createEmailVerificationCode(user);

  return res
    .status(201)
    .json(new ApiResponse(201, { email: user.email }, "Verification code sent to your email"));
});

export const resendEmailVerificationCode = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) throw new ApiError(400, "Email is required");
  if (!validator.isEmail(email)) throw new ApiError(400, "Please provide a valid email address");

  const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");
  if (user && user.emailVerified === false) {
    await createEmailVerificationCode(user);
  }

  return res.status(200).json(
    new ApiResponse(200, null, "If this email has an unverified account, a verification code has been sent")
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { otp } = req.body;
  if (!email || typeof otp !== "string" || !otp) {
    throw new ApiError(400, "Email and verification code are required");
  }
  if (!validator.isEmail(email)) throw new ApiError(400, "Please provide a valid email address");
  if (!/^\d{6}$/.test(otp)) throw new ApiError(400, "Verification code must be 6 digits");

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOne({
    email,
    emailVerified: false,
    emailVerificationToken: otpHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) throw new ApiError(400, "The verification code is invalid or expired");

  if (user.role === "worker") {
    await WorkerProfile.findOneAndUpdate(
      { user: user._id },
      { $setOnInsert: { user: user._id } },
      { upsert: true, new: true }
    );
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user._id);
  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, tokenCookieOptions(accessToken))
    .cookie("refreshToken", refreshToken, tokenCookieOptions(refreshToken))
    .json(new ApiResponse(200, { user: safeUser }, "Email verified successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await loginWithCredentials({ email, password });
  const { accessToken, refreshToken } = await generateTokens(user._id);

  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, tokenCookieOptions(accessToken))
    .cookie("refreshToken", refreshToken, tokenCookieOptions(refreshToken))
    .json(new ApiResponse(200, { user: safeUser }, "Login successful"));
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.isBlocked || !user.isActive || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been used");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, tokenCookieOptions(accessToken))
    .cookie("refreshToken", refreshToken, tokenCookieOptions(refreshToken))
    .json(new ApiResponse(200, null, "Access token refreshed"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "Current user fetched"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "Old password, new password and confirmation are required");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirmation do not match");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const isCurrentPassword = await user.isPasswordCorrect(oldPassword);
  if (!isCurrentPassword) {
    throw new ApiError(401, "Old password is incorrect");
  }
  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password must be different from the old password");
  }

  user.password = newPassword;
  await user.save();

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, tokenCookieOptions(accessToken))
    .cookie("refreshToken", refreshToken, tokenCookieOptions(refreshToken))
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (user) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetPasswordToken = crypto.createHash("sha256").update(otp).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({ email: user.email, name: user.name, otp });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(503, "Password reset email could not be sent. Please try again later.");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "If an account exists for that email, a reset code has been sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { otp, newPassword, confirmPassword } = req.body;
  if (
    !email ||
    typeof otp !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string" ||
    !otp ||
    !newPassword ||
    !confirmPassword
  ) {
    throw new ApiError(400, "Email, reset code, new password and confirmation are required");
  }
  if (!/^\d{6}$/.test(otp)) {
    throw new ApiError(400, "Reset code must be 6 digits");
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirmation do not match");
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const user = await User.findOne({
    email,
    resetPasswordToken: otpHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpires");

  if (!user) throw new ApiError(400, "The reset code is invalid or expired");

  user.password = newPassword;
  user.refreshToken = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
});
