import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "accepted" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: {
      text: {
        type: String,
        default: "",
        maxlength: [299, "Message cannot exceed 299 characters"],
      },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, status: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
