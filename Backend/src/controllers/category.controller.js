import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Category from "../models/category.model.js";

const DEFAULT_CATEGORIES = [
  { name: "Plumbing", slug: "plumbing", icon: "droplets", description: "Leak repairs, pipe fitting, fixture installation" },
  { name: "Electrical", slug: "electrical", icon: "zap", description: "Wiring, switchboards, appliance installation" },
  { name: "Carpentry", slug: "carpentry", icon: "hammer", description: "Furniture repair, woodwork, fittings" },
  { name: "Painting", slug: "painting", icon: "paintbrush", description: "Interior and exterior painting" },
  { name: "Cleaning", slug: "cleaning", icon: "sparkles", description: "Home and office deep cleaning" },
  { name: "AC Repair", slug: "ac-repair", icon: "wind", description: "AC servicing, installation, and repair" },
  { name: "Labour", slug: "labour", icon: "hard-hat", description: "General labour and physical assistance" },
  { name: "Other", slug: "other", icon: "briefcase", description: "A service category not listed above" },
];

export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      Category.findOneAndUpdate(
        { name: category.name },
        { $setOnInsert: category },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
  const categories = await Category.find(filter).sort({ name: 1 });

  return res.status(200).json(new ApiResponse(200, { categories }, "Categories fetched"));
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description } = req.body;
  if (!name) throw new ApiError(400, "Category name is required");

  const category = await Category.create({ name, icon, description });
  return res.status(201).json(new ApiResponse(201, { category }, "Category created"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, icon, description, isActive } = req.body;

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  if (name !== undefined) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  return res.status(200).json(new ApiResponse(200, { category }, "Category updated"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, null, "Category deleted"));
});
