import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_accepted",
        "booking_rejected",
        "booking_on_the_way",
        "booking_started",
        "booking_completed",
        "booking_cancelled",
        "payment_successful",
        "new_message",
        "message_request",
        "message_request_accepted",
        "verification_result",
        "review_received",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    relatedConversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
