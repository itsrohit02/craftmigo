import Service from "../models/service.model.js";
import ApiError from "../utils/ApiError.js";
import { parsePagination } from "../utils/pagination.js";
import WorkerProfile from "../models/workerProfile.model.js";
import User from "../models/user.model.js";

export const getVerifiedWorkerIds = async () => {
  const eligibleUserIds = await User.distinct("_id", {
    role: "worker",
    isBlocked: { $ne: true },
    isActive: { $ne: false },
  });

  return WorkerProfile.distinct("user", {
    user: { $in: eligibleUserIds },
    isBlocked: false,
    isSetupComplete: true,
    verificationStatus: "verified",
  });
};

export const getServiceById = async (id) => {
  const service = await Service.findById(id)
    .populate("category", "name slug icon")
    .populate("worker", "name avatar phone");

  if (!service || !service.worker) throw new ApiError(404, "Service not found");
  const [verifiedWorker, eligibleUser] = await Promise.all([
    WorkerProfile.exists({
      user: service.worker._id,
      isBlocked: false,
      isSetupComplete: true,
      verificationStatus: "verified",
    }),
    User.exists({
      _id: service.worker._id,
      role: "worker",
      isBlocked: { $ne: true },
      isActive: { $ne: false },
    }),
  ]);
  if (!verifiedWorker || !eligibleUser) throw new ApiError(404, "Service not found");
  return service;
};

export const listServicesQuery = async ({
  category,
  minPrice,
  maxPrice,
  pricingType,
  q,
  page,
  limit,
  sort = "-createdAt",
}) => {
  const verifiedWorkerIds = await getVerifiedWorkerIds();
  const filter = { isActive: true, worker: { $in: verifiedWorkerIds } };
  if (category) filter.category = category;
  if (pricingType) filter["pricing.type"] = pricingType;
  if (minPrice || maxPrice) {
    filter["pricing.amount"] = {};
    if (minPrice) filter["pricing.amount"].$gte = Number(minPrice);
    if (maxPrice) filter["pricing.amount"].$lte = Number(maxPrice);
  }
  if (q) {
    filter.$text = { $search: q };
  }

  const pagination = parsePagination({ page, limit }, { defaultLimit: 12, maxLimit: 50 });

  const [services, total] = await Promise.all([
    Service.find(filter)
      .populate("category", "name slug")
      .populate("worker", "name avatar")
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit),
    Service.countDocuments(filter),
  ]);

  return { services, total, page: pagination.page, pages: Math.ceil(total / pagination.limit) };
};
