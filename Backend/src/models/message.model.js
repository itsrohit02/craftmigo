import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [299, "Message cannot exceed 299 characters"],
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, _id: -1 });
messageSchema.index({ conversation: 1, isRead: 1, sender: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
