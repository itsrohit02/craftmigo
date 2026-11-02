import mongoose from "mongoose";
import slugify from "slugify";

const serviceImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    description: { type: String, required: true },
    pricing: {
      type: {
        type: String,
        enum: ["hourly", "daily"],
        default: "hourly",
      },
      amount: { type: Number, required: true, min: 0 },
    },
    durationMinutes: { type: Number, default: 60 },
    images: [serviceImageSchema],
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ title: "text", description: "text", tags: "text" });
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ worker: 1 });

serviceSchema.pre("validate", function (next) {
  if (this.title) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Date.now()
      .toString()
      .slice(-6)}`;
  }
  next();
});

const Service = mongoose.model("Service", serviceSchema);
export default Service;
