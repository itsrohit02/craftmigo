import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { parsePagination } from "../utils/pagination.js";
import User from "../models/user.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import Booking from "../models/booking.model.js";
import Review from "../models/review.model.js";
import { createNotification } from "../services/notification.service.js";
import { setUserBlocked } from "../services/workerAccess.service.js";
import cloudinary from "../config/cloudinary.js";

// GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalWorkers, totalBookings, completedBookings, paidBookings, pendingVerifications] =
    await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "worker" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "paid" }),
      WorkerProfile.countDocuments({ verificationStatus: "pending" }),
    ]);

  const revenueAgg = await Booking.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: "$price" } } },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalWorkers,
        totalBookings,
        completedBookings,
        paidBookings,
        pendingVerifications,
        totalRevenue: revenueAgg[0]?.total || 0,
      },
      "Dashboard stats fetched"
    )
  );
});

// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const { role = "user" } = req.query;
  const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const filter = { role };
  const [users, total] = await Promise.all([
    User.find(filter).select("-password -refreshToken").skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, { users, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) }, "Users fetched"));
});

// PATCH /api/admin/users/:id/block
export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Cannot block an admin account");

  await setUserBlocked(user, true);

  return res.status(200).json(new ApiResponse(200, null, "User blocked"));
});

// PATCH /api/admin/users/:id/unblock
export const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  await setUserBlocked(user, false);

  return res.status(200).json(new ApiResponse(200, null, "User unblocked"));
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(400, "Cannot delete an admin account");

  await user.deleteOne();
  if (user.role === "worker") {
    await WorkerProfile.findOneAndDelete({ user: user._id });
  }

  return res.status(200).json(new ApiResponse(200, null, "User deleted"));
});

// GET /api/admin/workers/pending-verification
export const listPendingVerifications = asyncHandler(async (req, res) => {
  const profiles = await WorkerProfile.find({ verificationStatus: "pending" }).populate(
    "user",
    "name email phone avatar"
  );
  const safeProfiles = profiles.map((profile) => {
    const safeProfile = profile.toObject();
    safeProfile.verificationDocs = safeProfile.verificationDocs.map(({ _id, label, format }) => ({
      _id,
      label,
      format,
    }));
    return safeProfile;
  });

  return res.status(200).json(new ApiResponse(200, { profiles: safeProfiles }, "Pending verifications fetched"));
});

// GET /api/admin/workers/:userId/verification-documents/:documentId
export const getVerificationDocument = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.params.userId });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  const document = profile.verificationDocs.id(req.params.documentId);
  if (!document) throw new ApiError(404, "Verification document not found");
  if (!document.publicId || !document.format) {
    throw new ApiError(410, "This verification document must be resubmitted before it can be viewed");
  }

  const downloadUrl = cloudinary.utils.private_download_url(document.publicId, document.format, {
    resource_type: "image",
    type: document.deliveryType || "upload",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  });

  res.set("Cache-Control", "private, no-store");
  res.set("Referrer-Policy", "no-referrer");
  return res.redirect(302, downloadUrl);
});

// PATCH /api/admin/workers/:userId/verify
export const verifyWorker = asyncHandler(async (req, res) => {
  const { approve, note } = req.body;
  const profile = await WorkerProfile.findOne({ user: req.params.userId });
  if (!profile) throw new ApiError(404, "Worker profile not found");

  profile.verificationStatus = approve ? "verified" : "rejected";
  profile.verificationNote = note || "";
  await profile.save();

  await createNotification({
    recipient: profile.user,
    type: "verification_result",
    title: approve ? "Verification approved" : "Verification rejected",
    body: note || "",
    link: "/worker/verification",
  });

  return res.status(200).json(new ApiResponse(200, { profile }, "Verification updated"));
});

// PATCH /api/admin/workers/:userId/block
export const blockWorker = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.params.userId });
  if (!profile) throw new ApiError(404, "Worker profile not found");
  const user = await User.findOne({ _id: req.params.userId, role: "worker" });
  if (!user) throw new ApiError(404, "Worker not found");

  await setUserBlocked(user, true);

  return res.status(200).json(new ApiResponse(200, null, "Worker blocked"));
});

// PATCH /api/admin/workers/:userId/unblock
export const unblockWorker = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.params.userId });
  if (!profile) throw new ApiError(404, "Worker profile not found");
  const user = await User.findOne({ _id: req.params.userId, role: "worker" });
  if (!user) throw new ApiError(404, "Worker not found");

  await setUserBlocked(user, false);

  return res.status(200).json(new ApiResponse(200, null, "Worker unblocked"));
});

// GET /api/admin/bookings
export const listAllBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = status ? { status } : {};

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("customer", "name email")
      .populate("worker", "name email")
      .populate("service", "title")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Booking.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, { bookings, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) }, "Bookings fetched"));
});

// GET /api/admin/payments
export const listPayments = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = { isPaid: true };
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("customer", "name email")
      .populate("worker", "name email")
      .populate("service", "title")
      .sort({ paidAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Booking.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { payments: bookings, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) }, "Payments fetched")
  );
});

// GET /api/admin/reviews
export const listAllReviews = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const [reviews, total] = await Promise.all([
    Review.find()
      .populate("customer", "name")
      .populate("worker", "name")
      .populate("service", "title")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Review.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { reviews, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) }, "Reviews fetched")
  );
});
