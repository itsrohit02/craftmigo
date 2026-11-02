import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Service from "../models/service.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/uploadToCloudinary.js";
import {
  getServiceById,
  getVerifiedWorkerIds,
  listServicesQuery,
} from "../services/service.service.js";

export const listServices = asyncHandler(async (req, res) => {
  const result = await listServicesQuery(req.query);
  return res.status(200).json(new ApiResponse(200, result, "Services fetched"));
});

export const getServiceDetails = asyncHandler(async (req, res) => {
  const service = await getServiceById(req.params.id);
  return res.status(200).json(new ApiResponse(200, { service }, "Service fetched"));
});

export const getMyServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ worker: req.user._id })
    .populate("category", "name slug")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, { services }, "Your services fetched"));
});

export const createService = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile || !profile.isSetupComplete) {
    throw new ApiError(400, "Complete your worker profile setup before creating services");
  }
  if (profile.verificationStatus !== "verified") {
    throw new ApiError(403, "Only verified workers can create services");
  }

  const { category, title, description, pricingType, amount, durationMinutes, tags } = req.body;

  if (!category || !title || !description || !pricingType || !amount) {
    throw new ApiError(400, "category, title, description, pricingType and amount are required");
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const { url, publicId } = await uploadBufferToCloudinary(file.buffer, "craftmigo/services");
      images.push({ url, publicId });
    }
  }

  const service = await Service.create({
    worker: req.user._id,
    category,
    title,
    description,
    pricing: { type: pricingType, amount },
    durationMinutes,
    images,
    tags: typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags || [],
  });

  return res.status(201).json(new ApiResponse(201, { service }, "Service created"));
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, worker: req.user._id });
  if (!service) throw new ApiError(404, "Service not found");

  const { title, description, pricingType, amount, durationMinutes, tags, category, isActive } = req.body;

  if (title !== undefined) service.title = title;
  if (description !== undefined) service.description = description;
  if (category !== undefined) service.category = category;
  if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
  if (isActive !== undefined) service.isActive = isActive;
  if (pricingType !== undefined) service.pricing.type = pricingType;
  if (amount !== undefined) service.pricing.amount = amount;
  if (tags !== undefined) {
    service.tags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags;
  }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const { url, publicId } = await uploadBufferToCloudinary(file.buffer, "craftmigo/services");
      service.images.push({ url, publicId });
    }
  }

  await service.save();
  return res.status(200).json(new ApiResponse(200, { service }, "Service updated"));
});

export const removeServiceImage = asyncHandler(async (req, res) => {
  const { id, publicId } = req.params;
  const service = await Service.findOne({ _id: id, worker: req.user._id });
  if (!service) throw new ApiError(404, "Service not found");

  const decodedPublicId = decodeURIComponent(publicId);
  await deleteFromCloudinary(decodedPublicId);
  service.images = service.images.filter((img) => img.publicId !== decodedPublicId);
  await service.save();

  return res.status(200).json(new ApiResponse(200, { service }, "Image removed"));
});

export const toggleServiceActive = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, worker: req.user._id });
  if (!service) throw new ApiError(404, "Service not found");

  service.isActive = !service.isActive;
  await service.save();

  return res.status(200).json(new ApiResponse(200, { service }, "Service status updated"));
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, worker: req.user._id });
  if (!service) throw new ApiError(404, "Service not found");

  for (const img of service.images) {
    await deleteFromCloudinary(img.publicId);
  }
  await service.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Service deleted"));
});

export const getServicesByWorker = asyncHandler(async (req, res) => {
  const verifiedWorkerIds = await getVerifiedWorkerIds();
  if (!verifiedWorkerIds.some((workerId) => String(workerId) === req.params.workerId)) {
    return res.status(200).json(new ApiResponse(200, { services: [] }, "Worker services fetched"));
  }

  const workerProfile = await WorkerProfile.findOne({
    user: req.params.workerId,
    isBlocked: false,
    isSetupComplete: true,
    verificationStatus: "verified",
  });
  if (!workerProfile) {
    return res.status(200).json(new ApiResponse(200, { services: [] }, "Worker services fetched"));
  }

  const services = await Service.find({ worker: req.params.workerId, isActive: true }).populate(
    "category",
    "name slug"
  );
  return res.status(200).json(new ApiResponse(200, { services }, "Worker services fetched"));
});
