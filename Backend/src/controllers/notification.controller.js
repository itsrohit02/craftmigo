import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Notification from "../models/notification.model.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
    type: { $ne: "new_message" },
  })
    .populate("relatedConversation", "participants status")
    .populate("relatedBooking", "_id status bookingCode")
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
    type: { $ne: "new_message" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched"));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");

  return res.status(200).json(new ApiResponse(200, { notification }, "Notification marked as read"));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});
