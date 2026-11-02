import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";
import { createNotification } from "../services/notification.service.js";
import { emitToUser } from "../config/socket.js";

const MAX_MESSAGE_LENGTH = 299;

// POST /api/messages/conversations  -> get-or-create a conversation with another user
export const startOrGetConversation = asyncHandler(async (req, res) => {
  const { participantId, bookingId } = req.body;
  if (!participantId) throw new ApiError(400, "participantId is required");
  if (participantId === String(req.user._id)) {
    throw new ApiError(400, "Cannot start a conversation with yourself");
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      relatedBooking: bookingId || undefined,
      status: "pending",
      requestedBy: req.user._id,
    });
  }

  conversation = await conversation.populate("participants", "name avatar role");

  return res.status(200).json(new ApiResponse(200, { conversation }, "Conversation ready"));
});

// GET /api/messages/conversations  -> list current user's conversations
export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .where({ status: "accepted" })
    .populate("participants", "name avatar role")
    .sort({ updatedAt: -1 });

  const unreadByConversation = conversations.length
    ? await Message.aggregate([
        {
          $match: {
            conversation: { $in: conversations.map((conversation) => conversation._id) },
            sender: { $ne: req.user._id },
            isRead: false,
          },
        },
        { $group: { _id: "$conversation", unreadCount: { $sum: 1 } } },
      ])
    : [];
  const unreadCounts = new Map(
    unreadByConversation.map(({ _id, unreadCount }) => [String(_id), unreadCount])
  );
  const conversationsWithUnread = conversations.map((conversation) => ({
    ...conversation.toObject(),
    unreadCount: unreadCounts.get(String(conversation._id)) || 0,
  }));
  const unreadCount = conversationsWithUnread.reduce((total, conversation) => total + conversation.unreadCount, 0);
  const unreadConversationIds = conversationsWithUnread
    .filter((conversation) => conversation.unreadCount > 0)
    .map((conversation) => String(conversation._id));

  return res.status(200).json(
    new ApiResponse(200, { conversations: conversationsWithUnread, unreadCount, unreadConversationIds }, "Conversations fetched")
  );
});

// GET /api/messages/conversations/:id  -> messages in a conversation
export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id).populate("participants", "name avatar role");
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (p) => String(p._id || p) === String(req.user._id)
  );
  if (!isParticipant) throw new ApiError(403, "You are not part of this conversation");
  if (conversation.status !== "accepted" && String(conversation.requestedBy) !== String(req.user._id)) {
    throw new ApiError(403, "This message request has not been accepted");
  }

  const limitValue = req.query.limit === undefined ? "20" : String(req.query.limit);
  if (!/^\d+$/.test(limitValue) || Number(limitValue) < 1 || Number(limitValue) > 50) {
    throw new ApiError(400, "limit must be an integer between 1 and 50");
  }
  const limit = Number(limitValue);
  const before = req.query.before;
  if (before !== undefined && !mongoose.isValidObjectId(before)) {
    throw new ApiError(400, "before must be a valid message identifier");
  }

  const filter = { conversation: conversation._id };
  if (before) filter._id = { $lt: new mongoose.Types.ObjectId(before) };

  const newestFirst = await Message.find(filter)
    .populate("sender", "name avatar")
    .sort({ _id: -1 })
    .limit(limit + 1);
  const hasMore = newestFirst.length > limit;
  if (hasMore) newestFirst.pop();
  const messages = newestFirst.reverse();

  if (messages.length > 0) {
    await Message.updateMany(
      {
        _id: { $in: messages.map((message) => message._id) },
        sender: { $ne: req.user._id },
        isRead: false,
      },
      { isRead: true }
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages,
        conversation,
        pagination: {
          hasMore,
          nextCursor: hasMore && messages.length > 0 ? String(messages[0]._id) : null,
        },
      },
      "Messages fetched"
    )
  );
});

// POST /api/messages/conversations/:id  -> send a message
export const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string" || !text.trim()) {
    throw new ApiError(400, "Message text is required");
  }
  const normalizedText = text.trim();
  if (normalizedText.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(req.user._id)
  );
  if (!isParticipant) throw new ApiError(403, "You are not part of this conversation");
  if (conversation.status === "rejected") throw new ApiError(403, "This message request was rejected");
  if (conversation.status === "pending" && String(conversation.requestedBy) !== String(req.user._id)) {
    throw new ApiError(403, "Wait for the message request to be accepted");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: normalizedText,
  });

  conversation.lastMessage = { text: normalizedText, sender: req.user._id, sentAt: new Date() };
  await conversation.save();

  const recipientId = conversation.participants.find((p) => String(p) !== String(req.user._id));
  if (recipientId && conversation.status === "pending") {
    const existingRequest = await Notification.findOne({
      recipient: recipientId,
      relatedConversation: conversation._id,
      type: "message_request",
    });

    if (!existingRequest) {
      await createNotification({
        recipient: recipientId,
        type: "message_request",
        title: "New message request",
        body: normalizedText.slice(0, 80),
        link: `/messages/${conversation._id}`,
        relatedConversation: conversation._id,
      });
    }
  }

  const populated = await message.populate("sender", "name avatar");
  if (conversation.status === "accepted") {
    emitToUser(recipientId, "message:new", { message: populated, conversationId: conversation._id });
  }

  return res.status(201).json(new ApiResponse(201, { message: populated }, "Message sent"));
});

const updateMessageRequest = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!["accept", "reject"].includes(action)) throw new ApiError(400, "Invalid message request action");

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (!conversation.participants.some((participant) => String(participant) === String(req.user._id))) {
    throw new ApiError(403, "You are not part of this conversation");
  }
  if (String(conversation.requestedBy) === String(req.user._id)) {
    throw new ApiError(403, "Only the recipient can respond to this request");
  }
  if (conversation.status !== "pending") throw new ApiError(400, "This request is no longer pending");

  conversation.status = action === "accept" ? "accepted" : "rejected";
  await conversation.save();

  await Notification.updateMany(
    { recipient: req.user._id, relatedConversation: conversation._id, type: "message_request", isRead: false },
    { isRead: true }
  );

  const requesterId = conversation.requestedBy;
  if (action === "accept") {
    await Notification.deleteMany({
      recipient: { $in: conversation.participants },
      type: "new_message",
      link: `/messages/${conversation._id}`,
    });
    await createNotification({
      recipient: requesterId,
      type: "message_request_accepted",
      title: "Message request accepted",
      body: "You can now chat with this user.",
      link: `/messages/${conversation._id}`,
      relatedConversation: conversation._id,
    });
  }

  emitToUser(requesterId, "message:request-updated", { conversationId: conversation._id, status: conversation.status });
  emitToUser(req.user._id, "message:request-updated", { conversationId: conversation._id, status: conversation.status });

  return res.status(200).json(new ApiResponse(200, { status: conversation.status }, `Message request ${action}ed`));
});

export { updateMessageRequest };
