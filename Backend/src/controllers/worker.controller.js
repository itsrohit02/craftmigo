import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import WorkerProfile from "../models/workerProfile.model.js";
import { parsePagination } from "../utils/pagination.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import { getVerifiedWorkerIds } from "../services/service.service.js";

// GET /api/workers/me -> the logged-in worker's own profile
export const getMyWorkerProfile = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id })
    .populate("categories", "name slug icon")
    .populate("user", "name email phone avatar address");

  if (!profile) throw new ApiError(404, "Worker profile not found");

  return res.status(200).json(new ApiResponse(200, { profile }, "Worker profile fetched"));
});

// PATCH /api/workers/me -> setup / edit worker profile
export const updateMyWorkerProfile = asyncHandler(async (req, res) => {
  const { bio, skills, categories, customCategory, serviceAreas, experienceYears, name, phone, address } = req.body;

  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  if (bio !== undefined) profile.bio = bio;
  if (skills !== undefined) profile.skills = skills;
  if (categories !== undefined) profile.categories = categories;
  if (customCategory !== undefined) profile.customCategory = customCategory.trim();
  if (serviceAreas !== undefined) profile.serviceAreas = serviceAreas;
  if (experienceYears !== undefined) profile.experienceYears = experienceYears;

  const hasCoreInfo =
    profile.bio && profile.skills?.length && profile.serviceAreas?.length && profile.categories?.length;
  if (hasCoreInfo && !profile.isSetupComplete) {
    profile.isSetupComplete = true;
    profile.isAvailable = true;
    profile.availabilityChangedAt = new Date();
  }

  await profile.save();

  // Allow updating shared user fields (name/phone/address) from the same form
  if (name || phone || address) {
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = { ...user.address?.toObject?.(), ...address };
    await user.save();
  }

  const updated = await WorkerProfile.findOne({ user: req.user._id })
    .populate("categories", "name slug icon")
    .populate("user", "name email phone avatar address");

  return res.status(200).json(new ApiResponse(200, { profile: updated }, "Worker profile updated"));
});

// PATCH /api/workers/me/availability
export const toggleAvailability = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  profile.isAvailable = !profile.isAvailable;
  profile.availabilityChangedAt = new Date();
  await profile.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { isAvailable: profile.isAvailable }, "Availability updated"));
});

// POST /api/workers/me/portfolio
export const addPortfolioItem = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  const { url, publicId } = await uploadBufferToCloudinary(req.file.buffer, "craftmigo/portfolio");

  profile.portfolio.push({ url, publicId, caption: req.body.caption || "" });
  await profile.save();

  return res.status(201).json(new ApiResponse(201, { portfolio: profile.portfolio }, "Portfolio item added"));
});

// DELETE /api/workers/me/portfolio/:itemId
export const removePortfolioItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  const item = profile.portfolio.id(itemId);
  if (!item) throw new ApiError(404, "Portfolio item not found");

  await deleteFromCloudinary(item.publicId);
  item.deleteOne();
  await profile.save();

  return res.status(200).json(new ApiResponse(200, { portfolio: profile.portfolio }, "Portfolio item removed"));
});

// POST /api/workers/me/verification
export const submitVerification = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one verification document is required");
  }

  const uploaded = [];
  for (const file of req.files) {
    const { url, publicId, format, deliveryType } = await uploadBufferToCloudinary(
      file.buffer,
      "craftmigo/verification",
      "authenticated"
    );
    uploaded.push({ url, publicId, format, deliveryType, label: "id_document" });
  }

  profile.verificationDocs.push(...uploaded);
  profile.verificationStatus = "pending";
  await profile.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { verificationStatus: profile.verificationStatus }, "Verification submitted"));
});

// GET /api/workers/:id -> public worker profile
export const getPublicWorkerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const verifiedWorkerIds = await getVerifiedWorkerIds();
  if (!verifiedWorkerIds.some((workerId) => String(workerId) === id)) {
    throw new ApiError(404, "Worker not found");
  }

  const profile = await WorkerProfile.findOne({
    user: id,
    isBlocked: false,
    isSetupComplete: true,
    verificationStatus: "verified",
  })
    .select("-verificationDocs -verificationNote -totalEarnings -isBlocked")
    .populate("categories", "name slug icon")
    .populate("user", "name avatar");

  if (!profile) throw new ApiError(404, "Worker not found");

  const reviews = await Review.find({ worker: id, isHidden: false })
    .populate("customer", "name avatar")
    .populate("service", "title")
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json(new ApiResponse(200, { profile, reviews }, "Worker profile fetched"));
});

// GET /api/workers -> search/list workers (for customers)
export const listWorkers = asyncHandler(async (req, res) => {
  const { category, area, minRating } = req.query;
  const pagination = parsePagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const verifiedWorkerIds = await getVerifiedWorkerIds();

  const filter = {
    user: { $in: verifiedWorkerIds },
    isBlocked: false,
    isSetupComplete: true,
    verificationStatus: "verified",
  };
  if (category) filter.categories = category;
  if (area) filter.serviceAreas = { $regex: area, $options: "i" };
  if (minRating) filter.ratingAverage = { $gte: Number(minRating) };

  const [workers, total] = await Promise.all([
    WorkerProfile.find(filter)
      .select("-verificationDocs -verificationNote -totalEarnings -isBlocked")
      .populate("categories", "name slug")
      .populate("user", "name avatar")
      .sort({ ratingAverage: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    WorkerProfile.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { workers, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) },
      "Workers fetched"
    )
  );
});
