import mongoose from "mongoose";

const portfolioItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: true }
);

const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String, trim: true, default: "" },
    skills: [{ type: String, trim: true }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    customCategory: { type: String, trim: true, default: "" },
    serviceAreas: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    availabilityChangedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationDocs: [
      {
        url: String,
        publicId: String,
        label: String,
        format: String,
        deliveryType: { type: String, enum: ["upload", "private", "authenticated"], default: "upload" },
        legacyPublicId: String,
      },
    ],
    verificationNote: { type: String, default: "" },
    portfolio: [portfolioItemSchema],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isSetupComplete: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

workerProfileSchema.index({ serviceAreas: 1 });
workerProfileSchema.index({ categories: 1 });

const WorkerProfile = mongoose.model("WorkerProfile", workerProfileSchema);
export default WorkerProfile;
