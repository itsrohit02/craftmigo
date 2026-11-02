import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    contact: {
      supportEmail: { type: String, trim: true, lowercase: true, default: "" },
      supportPhone: { type: String, trim: true, default: "" },
      locationAddress: { type: String, trim: true, default: "" },
      socialLinks: {
        instagram: { type: String, trim: true, default: "" },
        facebook: { type: String, trim: true, default: "" },
        twitter: { type: String, trim: true, default: "" },
        linkedin: { type: String, trim: true, default: "" },
      },
    },
  },
  { timestamps: true }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
export default SystemSettings;
