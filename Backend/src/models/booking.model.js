import mongoose from "mongoose";

export const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "on_the_way",
  "started",
  "completed",
  "paid",
  "cancelled",
  "rejected",
  "disputed",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    bookingCode: { type: String, unique: true },
    scheduledDate: { type: Date, required: true },
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
      lat: Number,
      lng: Number,
    },
    price: { type: Number, required: true },
    pricingType: { type: String, enum: ["hourly", "daily"], required: true },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "pending",
    },
    statusHistory: [statusHistorySchema],
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    cancelReason: { type: String, default: "" },
    rejectReason: { type: String, default: "" },
    hasReview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  if (this.isNew) {
    this.bookingCode = `BK${Date.now().toString().slice(-8)}`;
    this.statusHistory.push({ status: this.status });
  }
  next();
});

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
