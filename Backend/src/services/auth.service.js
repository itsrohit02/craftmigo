import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const generateTokens = async (userId) => {
  const user = await User.findById(userId).select("+refreshToken");
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const registerUser = async ({ name, email, password, phone, role }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Admin can never self-register through the public signup endpoint
  const safeRole = role === "worker" ? "worker" : "user";

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: safeRole,
    emailVerified: false,
  });

  return user;
};

export const loginWithCredentials = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked. Contact support.");
  }

  if (user.emailVerified === false) {
    throw new ApiError(403, "Please verify your email before logging in. Request a new code to continue.");
  }

  return user;
};
