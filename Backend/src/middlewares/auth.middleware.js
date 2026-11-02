import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decoded._id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }
  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

  req.user = user;
  next();
});

export const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
};

// Attaches req.workerProfile for worker-role users; used by worker-scoped routes
export const attachWorkerProfile = asyncHandler(async (req, _res, next) => {
  const WorkerProfile = (await import("../models/workerProfile.model.js")).default;
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) {
    throw new ApiError(404, "Worker profile not found. Please complete worker setup.");
  }
  req.workerProfile = profile;
  next();
});
