import multer from "multer";
import ApiError from "../utils/ApiError.js";

const storage = multer.memoryStorage();
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const imageSignatures = [
  {
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: "image/gif",
    matches: (buffer) =>
      buffer.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)),
  },
  {
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
];

const fileFilter = (req, file, cb) => {
  if (imageSignatures.some(({ mimeType }) => mimeType === file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only JPEG, PNG, GIF, or WebP image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 6 },
});

export const validateImageUploads = (req, _res, next) => {
  const files = req.file ? [req.file] : req.files || [];

  for (const file of files) {
    const signature = imageSignatures.find(({ mimeType, matches }) =>
      mimeType === file.mimetype && matches(file.buffer)
    );
    if (!signature) {
      return next(new ApiError(400, "Uploaded file contents do not match a supported image format"));
    }
  }

  return next();
};
