import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Service from "../models/service.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import Category from "../models/category.model.js";
import { parsePagination } from "../utils/pagination.js";
import { getVerifiedWorkerIds } from "../services/service.service.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/search?q=plumber&type=all
export const globalSearch = asyncHandler(async (req, res) => {
  const { q = "", type = "all" } = req.query;
  const { limit } = parsePagination(req.query, { defaultLimit: 8, maxLimit: 50 });

  if (typeof q !== "string") throw new ApiError(400, "Search query must be text");

  const results = { services: [], workers: [], categories: [] };
  const trimmed = q.trim();
  if (trimmed.length > 100) throw new ApiError(400, "Search query must be 100 characters or fewer");
  const escapedQuery = escapeRegex(trimmed);

  if (!trimmed) {
    return res.status(200).json(new ApiResponse(200, results, "Search results"));
  }

  const verifiedWorkerIds =
    type === "all" || type === "services" || type === "workers"
      ? await getVerifiedWorkerIds()
      : [];
  const tasks = [];

  if (type === "all" || type === "services") {
    tasks.push((async () => {
      results.services = await Service.find({
        isActive: true,
        worker: { $in: verifiedWorkerIds },
        $text: { $search: trimmed },
      })
        .populate("category", "name slug")
        .populate("worker", "name avatar")
        .limit(limit);
    })());
  }

  if (type === "all" || type === "workers") {
    tasks.push(
      WorkerProfile.find({
        user: { $in: verifiedWorkerIds },
        isBlocked: false,
        isSetupComplete: true,
        verificationStatus: "verified",
        $or: [
          { skills: { $regex: escapedQuery, $options: "i" } },
          { serviceAreas: { $regex: escapedQuery, $options: "i" } },
        ],
      })
        .select("-verificationDocs -verificationNote -totalEarnings -isBlocked")
        .populate("user", "name avatar")
        .populate("categories", "name slug")
        .limit(limit)
        .then((docs) => (results.workers = docs))
    );
  }

  if (type === "all" || type === "categories") {
    tasks.push(
      Category.find({ isActive: true, name: { $regex: escapedQuery, $options: "i" } })
        .limit(limit)
        .then((docs) => (results.categories = docs))
    );
  }

  await Promise.all(tasks);

  return res.status(200).json(new ApiResponse(200, results, "Search results"));
});
