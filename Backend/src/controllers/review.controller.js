import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import Service from "../models/service.model.js";
import { createNotification } from "../services/notification.service.js";

const recalcWorkerRating = async (workerId) => {
  const stats = await Review.aggregate([
    { $match: { worker: workerId, isHidden: false } },
    { $group: { _id: "$worker", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await WorkerProfile.findOneAndUpdate(
    { user: workerId },
    { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count }
  );
};

const recalcServiceRating = async (serviceId) => {
  const stats = await Review.aggregate([
    { $match: { service: serviceId, isHidden: false } },
    { $group: { _id: "$service", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Service.findByIdAndUpdate(serviceId, {
    ratingAverage: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
};

// POST /api/reviews
export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating) throw new ApiError(400, "bookingId and rating are required");
  if (typeof comment !== "string" || !comment.trim()) {
    throw new ApiError(400, "A review comment is required");
  }
  if (rating < 1 || rating > 5) throw new ApiError(400, "Rating must be between 1 and 5");

  const booking = await Booking.findOne({ _id: bookingId, customer: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  if (!["completed", "paid"].includes(booking.status)) {
    throw new ApiError(400, "You can only review a completed booking");
  }
  if (booking.hasReview) {
    throw new ApiError(409, "You have already reviewed this booking");
  }

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    worker: booking.worker,
    service: booking.service,
    rating,
    comment: comment.trim(),
  });

  booking.hasReview = true;
  await booking.save();

  await recalcWorkerRating(booking.worker);
  await recalcServiceRating(booking.service);

  await createNotification({
    recipient: booking.worker,
    type: "review_received",
    title: "You received a new review",
    body: `A user left a ${rating}-star review`,
    link: `/worker/reviews`,
  });

  return res.status(201).json(new ApiResponse(201, { review }, "Review submitted"));
});

// GET /api/reviews/worker/:workerId
export const getWorkerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ worker: req.params.workerId, isHidden: false })
    .populate("customer", "name avatar")
    .populate("service", "title")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { reviews }, "Reviews fetched"));
});

// GET /api/reviews/me  (customer's own review history)
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate("worker", "name avatar")
    .populate("service", "title")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { reviews }, "Your reviews fetched"));
});

// PATCH /api/reviews/:id/moderate  (admin)
export const moderateReview = asyncHandler(async (req, res) => {
  const { isHidden } = req.body;
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");

  review.isHidden = !!isHidden;
  await review.save();

  await recalcWorkerRating(review.worker);
  await recalcServiceRating(review.service);

  return res.status(200).json(new ApiResponse(200, { review }, "Review moderated"));
});
