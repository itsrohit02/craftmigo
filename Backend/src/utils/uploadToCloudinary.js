import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Uploads a file buffer (from multer memoryStorage) to Cloudinary.
 * @param {Buffer} buffer - file buffer
 * @param {string} folder - cloudinary folder, e.g. "craftmigo/services"
 * @param {"upload" | "private" | "authenticated"} deliveryType - asset access mode
 * @returns {Promise<{url: string, publicId: string, format: string, deliveryType: string}>}
 */
export const uploadBufferToCloudinary = (
  buffer,
  folder = "craftmigo/misc",
  deliveryType = "upload"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", type: deliveryType },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload returned no result"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          deliveryType,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};
