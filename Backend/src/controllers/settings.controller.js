import validator from "validator";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import SystemSettings from "../models/systemSettings.model.js";

const CONTACT_KEY = "platform";
const SOCIAL_PLATFORMS = ["instagram", "facebook", "twitter", "linkedin"];

const emptyContactSettings = {
  supportEmail: "",
  supportPhone: "",
  locationAddress: "",
  socialLinks: Object.fromEntries(SOCIAL_PLATFORMS.map((platform) => [platform, ""])),
};

export const getContactSettings = asyncHandler(async (_req, res) => {
  const settings = await SystemSettings.findOne({ key: CONTACT_KEY }).lean();
  const contact = settings?.contact || emptyContactSettings;

  return res
    .status(200)
    .json(new ApiResponse(200, { contact }, "Contact settings fetched"));
});

export const updateContactSettings = asyncHandler(async (req, res) => {
  const { supportEmail, supportPhone, locationAddress, socialLinks } = req.body;

  if (
    typeof supportEmail !== "string" ||
    typeof supportPhone !== "string" ||
    typeof locationAddress !== "string" ||
    !socialLinks ||
    typeof socialLinks !== "object" ||
    Array.isArray(socialLinks)
  ) {
    throw new ApiError(400, "All contact settings fields are required");
  }

  const normalized = {
    supportEmail: supportEmail.trim().toLowerCase(),
    supportPhone: supportPhone.trim(),
    locationAddress: locationAddress.trim(),
    socialLinks: {},
  };

  if (normalized.supportEmail && !validator.isEmail(normalized.supportEmail)) {
    throw new ApiError(400, "Enter a valid support email address");
  }
  if (normalized.supportPhone.length > 40) {
    throw new ApiError(400, "Support phone must be 40 characters or fewer");
  }
  if (normalized.locationAddress.length > 300) {
    throw new ApiError(400, "Location address must be 300 characters or fewer");
  }

  for (const platform of SOCIAL_PLATFORMS) {
    const value = socialLinks[platform];
    if (typeof value !== "string") {
      throw new ApiError(400, `${platform} URL must be text`);
    }

    const url = value.trim();
    if (url && !validator.isURL(url, { protocols: ["https"], require_protocol: true })) {
      throw new ApiError(400, `${platform} URL must be a valid HTTPS URL`);
    }
    normalized.socialLinks[platform] = url;
  }

  const settings = await SystemSettings.findOneAndUpdate(
    { key: CONTACT_KEY },
    { $set: { contact: normalized }, $setOnInsert: { key: CONTACT_KEY } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, { contact: settings.contact }, "Contact settings updated"));
});
