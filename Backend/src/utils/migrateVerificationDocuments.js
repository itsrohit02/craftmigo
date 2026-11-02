import "../config/env.js";

import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import connectDB from "../config/db.js";
import WorkerProfile from "../models/workerProfile.model.js";
import { uploadBufferToCloudinary } from "./uploadToCloudinary.js";

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const applyChanges = process.argv.includes("--apply");
const unexpectedArguments = process.argv.slice(2).filter((arg) => arg !== "--apply");

const migrate = async () => {
  if (unexpectedArguments.length > 0) {
    throw new Error(`Unknown argument: ${unexpectedArguments[0]}`);
  }

  if (process.env.NODE_ENV === "production" && !applyChanges) {
    console.log("Production database detected. This dry run made no changes.");
  }

  await connectDB();

  let pending = 0;
  let migrated = 0;
  let failed = 0;

  try {
    const profiles = WorkerProfile.find({ "verificationDocs.0": { $exists: true } }).cursor();

    for await (const profile of profiles) {
      for (const document of profile.verificationDocs) {
        if (document.deliveryType === "authenticated" && !document.legacyPublicId) continue;

        pending += 1;
        if (!applyChanges) continue;

        try {
          if (document.legacyPublicId) {
            const deletion = await cloudinary.uploader.destroy(document.legacyPublicId, {
              resource_type: "image",
              type: "upload",
            });
            if (!["ok", "not found"].includes(deletion.result)) {
              throw new Error("Legacy Cloudinary asset could not be deleted");
            }
            document.legacyPublicId = undefined;
            await profile.save();
            migrated += 1;
            continue;
          }

          if (!document.publicId || !document.url) {
            throw new Error("Document is missing its existing Cloudinary ID or URL");
          }

          const sourceUrl = new URL(document.url);
          if (
            sourceUrl.protocol !== "https:" ||
            sourceUrl.hostname !== "res.cloudinary.com" ||
            sourceUrl.pathname.split("/")[1] !== process.env.CLOUDINARY_CLOUD_NAME
          ) {
            throw new Error("Document URL is not a Cloudinary URL for the configured cloud");
          }

          const response = await fetch(sourceUrl);
          if (!response.ok) throw new Error(`Cloudinary download failed with status ${response.status}`);

          const contentLength = Number(response.headers.get("content-length") || 0);
          if (contentLength > MAX_DOCUMENT_SIZE) {
            throw new Error("Existing document exceeds the 5 MB upload limit");
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer.length > MAX_DOCUMENT_SIZE) {
            throw new Error("Existing document exceeds the 5 MB upload limit");
          }

          const pathFormat = sourceUrl.pathname.match(/\.([a-z0-9]+)$/i)?.[1];
          const format = document.format || pathFormat;
          if (!format) throw new Error("Could not determine the document format");

          const oldPublicId = document.publicId;
          const uploaded = await uploadBufferToCloudinary(
            buffer,
            "craftmigo/verification",
            "authenticated"
          );

          document.legacyPublicId = oldPublicId;
          document.url = uploaded.url;
          document.publicId = uploaded.publicId;
          document.format = uploaded.format || format;
          document.deliveryType = "authenticated";
          await profile.save();

          const deletion = await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: "image",
            type: "upload",
          });
          if (!["ok", "not found"].includes(deletion.result)) {
            throw new Error("Legacy Cloudinary asset could not be deleted");
          }

          document.legacyPublicId = undefined;
          await profile.save();
          migrated += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to migrate one verification document: ${error.message}`);
        }
      }
    }
  } finally {
    await mongoose.disconnect();
  }

  if (!applyChanges) {
    console.log(`${pending} verification document(s) need migration. No changes were made.`);
    console.log("Review the target database, then rerun with --apply to migrate them.");
  } else {
    console.log(`Verification document migration complete: ${migrated} migrated, ${failed} failed.`);
  }

  if (failed > 0) process.exitCode = 1;
};

migrate().catch(async (error) => {
  console.error("Verification document migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
