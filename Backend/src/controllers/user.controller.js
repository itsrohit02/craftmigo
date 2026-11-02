import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Service from "../models/service.model.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address?.toObject?.(), ...address };

  await user.save();

  const safeUser = await User.findById(user._id).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, { user: safeUser }, "Profile updated"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const oldPublicId = user.avatar?.publicId;
  const { url, publicId } = await uploadBufferToCloudinary(req.file.buffer, "craftmigo/avatars");

  user.avatar = { url, publicId };
  await user.save();

  if (oldPublicId) await deleteFromCloudinary(oldPublicId);

  const safeUser = await User.findById(user._id).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, { user: safeUser }, "Avatar updated"));
});

export const addFavoriteService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const service = await Service.findById(serviceId);
  if (!service) throw new ApiError(404, "Service not found");

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { "favorites.services": serviceId },
  });

  return res.status(200).json(new ApiResponse(200, null, "Added to favorites"));
});

export const removeFavoriteService = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { "favorites.services": serviceId },
  });

  return res.status(200).json(new ApiResponse(200, null, "Removed from favorites"));
});

export const addFavoriteWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  const worker = await User.findOne({ _id: workerId, role: "worker" });
  if (!worker) throw new ApiError(404, "Worker not found");

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { "favorites.workers": workerId },
  });

  return res.status(200).json(new ApiResponse(200, null, "Added to favorites"));
});

export const removeFavoriteWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { "favorites.workers": workerId },
  });

  return res.status(200).json(new ApiResponse(200, null, "Removed from favorites"));
});

export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: "favorites.services",
      match: { isActive: true },
      populate: { path: "category", select: "name slug" },
    })
    .populate({
      path: "favorites.workers",
      select: "name avatar",
    });

  return res.status(200).json(new ApiResponse(200, { favorites: user.favorites }, "Favorites fetched"));
});
