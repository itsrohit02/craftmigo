import { Wrench, Zap, Hammer, Paintbrush, Sparkles, Wind, Droplets, Home } from "lucide-react";

// Fallback icon set for common trade categories; used until backend categories load
export const CATEGORY_ICON_MAP = {
  plumbing: Droplets,
  electrical: Zap,
  carpentry: Hammer,
  painting: Paintbrush,
  cleaning: Sparkles,
  "ac repair": Wind,
  hvac: Wind,
  general: Wrench,
  default: Home,
};

export const getCategoryIcon = (name = "") => {
  const key = name.toLowerCase();
  return CATEGORY_ICON_MAP[key] || CATEGORY_ICON_MAP.default;
};
