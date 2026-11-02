import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
