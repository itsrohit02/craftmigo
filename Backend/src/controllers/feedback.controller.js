import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Feedback from "../models/feedback.model.js";

const FEEDBACK_STATUSES = ["new", "reviewed", "resolved"];

export const createFeedback = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 2000) {
    throw new ApiError(400, "Feedback must be between 10 and 2000 characters");
  }

  const feedback = await Feedback.create({
    user: req.user._id,
    message: message.trim(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { feedback }, "Feedback submitted successfully"));
});

export const listFeedback = asyncHandler(async (_req, res) => {
  const feedback = await Feedback.find()
    .populate("user", "name email role")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { feedback }, "Feedback fetched"));
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!FEEDBACK_STATUSES.includes(status)) {
    throw new ApiError(400, "Choose a valid feedback status");
  }

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  )
    .populate("user", "name email role")
    .lean();

  if (!feedback) throw new ApiError(404, "Feedback not found");

  return res.status(200).json(new ApiResponse(200, { feedback }, "Feedback status updated"));
});
