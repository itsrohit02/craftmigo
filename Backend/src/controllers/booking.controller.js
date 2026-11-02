import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import Booking from "../models/booking.model.js";
import Notification from "../models/notification.model.js";
import Service from "../models/service.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import User from "../models/user.model.js";
import { applyStatusChange } from "../services/booking.service.js";
import { createNotification } from "../services/notification.service.js";
import { emitToUser } from "../config/socket.js";
import { isWorkerBookable } from "../services/workerAccess.service.js";

// POST /api/bookings  (customer creates a booking)
export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, scheduledDate, address } = req.body;

  if (!serviceId || !scheduledDate || !address || typeof address !== "object" || Array.isArray(address)) {
    throw new ApiError(400, "serviceId, scheduledDate and address are required");
  }
  if (!mongoose.isValidObjectId(serviceId)) {
    throw new ApiError(400, "Invalid service identifier");
  }

  const parsedScheduledDate = new Date(scheduledDate);
  if (Number.isNaN(parsedScheduledDate.getTime())) {
    throw new ApiError(400, "scheduledDate must be a valid date");
  }
  if (parsedScheduledDate.getTime() <= Date.now()) {
    throw new ApiError(400, "scheduledDate must be in the future");
  }

  const addressFields = ["line1", "city", "state", "pincode"];
  const normalizedAddress = Object.fromEntries(
    addressFields.map((field) => [field, typeof address[field] === "string" ? address[field].trim() : ""])
  );
  if (Object.values(normalizedAddress).some((value) => !value)) {
    throw new ApiError(400, "Complete address is required");
  }
  if (!/^\d{4,10}$/.test(normalizedAddress.pincode)) {
    throw new ApiError(400, "Pincode must contain 4 to 10 digits");
  }

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) throw new ApiError(404, "Service not found or unavailable");
  if (String(service.worker) === String(req.user._id)) {
    throw new ApiError(400, "You cannot book your own service");
  }

  const [workerProfile, eligibleWorker] = await Promise.all([
    WorkerProfile.findOne({
      user: service.worker,
      isBlocked: false,
      isSetupComplete: true,
      verificationStatus: "verified",
      isAvailable: true,
    }),
    User.exists({
      _id: service.worker,
      role: "worker",
      isBlocked: { $ne: true },
      isActive: { $ne: false },
    }),
  ]);
  if (!isWorkerBookable(workerProfile, eligibleWorker)) {
    throw new ApiError(400, "This worker is currently unavailable for new bookings");
  }

  const price = Number(service.pricing?.amount);
  if (!Number.isFinite(price) || price < 0) {
    throw new ApiError(500, "Service price is invalid");
  }

  const booking = await Booking.create({
    customer: req.user._id,
    worker: service.worker,
    service: service._id,
    scheduledDate: parsedScheduledDate,
    address: normalizedAddress,
    price,
    pricingType: service.pricing.type,
  });

  service.bookingCount += 1;
  await service.save();

  await createNotification({
    recipient: service.worker,
    type: "booking_created",
    title: "New booking request",
    body: `You have a new booking request for "${service.title}"`,
    link: `/bookings/${booking._id}`,
    relatedBooking: booking._id,
  });

  return res.status(201).json(new ApiResponse(201, { booking }, "Booking created"));
});

// GET /api/bookings/customer  (customer's bookings)
export const getCustomerBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { customer: req.user._id };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate("service", "title images pricing")
    .populate("worker", "name avatar phone")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { bookings }, "Bookings fetched"));
});

// GET /api/bookings/worker  (worker's bookings/requests)
export const getWorkerBookings = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { worker: req.user._id };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate("service", "title images pricing")
    .populate("customer", "name avatar phone")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { bookings }, "Bookings fetched"));
});

// GET /api/bookings/:id
export const getBookingDetails = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("service", "title images pricing durationMinutes")
    .populate("customer", "name avatar phone address")
    .populate("worker", "name avatar phone");

  if (!booking) throw new ApiError(404, "Booking not found");

  const isParticipant =
    String(booking.customer._id) === String(req.user._id) ||
    String(booking.worker._id) === String(req.user._id);
  if (!isParticipant && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have access to this booking");
  }

  return res.status(200).json(new ApiResponse(200, { booking }, "Booking fetched"));
});

const notifyStatusChange = async (booking, status) => {
  const map = {
    accepted: { recipient: booking.customer, title: "Booking accepted", type: "booking_accepted" },
    rejected: { recipient: booking.customer, title: "Booking rejected", type: "booking_rejected" },
    on_the_way: { recipient: booking.customer, title: "Worker is on the way", type: "booking_on_the_way" },
    started: { recipient: booking.customer, title: "Service started", type: "booking_started" },
    completed: { recipient: booking.customer, title: "Service completed", type: "booking_completed" },
    paid: { recipient: booking.worker, title: "Payment received", type: "payment_successful" },
    cancelled: { recipient: booking.worker, title: "Booking cancelled", type: "booking_cancelled" },
  };
  const entry = map[status];
  if (!entry) return;
  await createNotification({
    recipient: entry.recipient,
    type: entry.type,
    title: entry.title,
    body: `Booking ${booking.bookingCode} status changed to "${status}"`,
    link: `/bookings/${booking._id}`,
    relatedBooking: booking._id,
  });
};

const markBookingRequestNotificationRead = async (booking) => {
  await Notification.updateMany(
    {
      recipient: booking.worker,
      relatedBooking: booking._id,
      type: "booking_created",
      isRead: false,
    },
    { $set: { isRead: true } }
  );

  const unreadCount = await Notification.countDocuments({
    recipient: booking.worker,
    isRead: false,
    type: { $ne: "new_message" },
  });
  emitToUser(booking.worker, "notification:count-updated", { unreadCount });
};

// PATCH /api/bookings/:id/accept  (worker)
export const acceptBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, worker: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  await applyStatusChange(booking, "accepted", "worker");
  await markBookingRequestNotificationRead(booking);
  await notifyStatusChange(booking, "accepted");

  return res.status(200).json(new ApiResponse(200, { booking }, "Booking accepted"));
});

// PATCH /api/bookings/:id/reject  (worker)
export const rejectBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findOne({ _id: req.params.id, worker: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  await applyStatusChange(booking, "rejected", "worker", reason);
  booking.rejectReason = reason || "";
  await booking.save();
  await markBookingRequestNotificationRead(booking);
  await notifyStatusChange(booking, "rejected");

  return res.status(200).json(new ApiResponse(200, { booking }, "Booking rejected"));
});

// PATCH /api/bookings/:id/on-the-way  (worker)
export const markOnTheWay = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, worker: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  await applyStatusChange(booking, "on_the_way", "worker");
  await notifyStatusChange(booking, "on_the_way");

  return res.status(200).json(new ApiResponse(200, { booking }, "Marked as on the way"));
});

// PATCH /api/bookings/:id/start  (worker)
export const startBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, worker: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  await applyStatusChange(booking, "started", "worker");
  await notifyStatusChange(booking, "started");

  return res.status(200).json(new ApiResponse(200, { booking }, "Service started"));
});

// PATCH /api/bookings/:id/complete  (worker)
export const completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, worker: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  await applyStatusChange(booking, "completed", "worker");
  await notifyStatusChange(booking, "completed");

  return res.status(200).json(new ApiResponse(200, { booking }, "Service marked complete"));
});

// PATCH /api/bookings/:id/cancel  (customer)
export const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) throw new ApiError(404, "Booking not found");

  await applyStatusChange(booking, "cancelled", "customer", reason);
  booking.cancelReason = reason || "";
  await booking.save();
  await notifyStatusChange(booking, "cancelled");

  return res.status(200).json(new ApiResponse(200, { booking }, "Booking cancelled"));
});

// PATCH /api/bookings/:id/pay  (customer) - marks paid; gateway integration to be added later
export const markBookingPaid = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.DEMO_PAYMENT_ENABLED !== "true") {
    throw new ApiError(503, "Payment gateway is not configured");
  }

  const booking = await Booking.findOneAndUpdate(
    {
    _id: req.params.id,
    customer: req.user._id,
    status: "completed",
    isPaid: false,
    },
    {
      $set: { status: "paid", isPaid: true, paidAt: new Date() },
      $push: { statusHistory: { status: "paid", note: "Demo payment recorded" } },
    },
    { new: true }
  );
  if (!booking) throw new ApiError(404, "Booking not found");

  const worker = await WorkerProfile.findOne({ user: booking.worker });
  if (worker) {
    worker.totalEarnings += booking.price;
    await worker.save();
  }

  await notifyStatusChange(booking, "paid");

  return res.status(200).json(new ApiResponse(200, { booking }, "Payment recorded"));
});
