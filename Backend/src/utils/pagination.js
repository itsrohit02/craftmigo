import ApiError from "./ApiError.js";

const MAX_PAGE = 100_000;

const parseInteger = (value, field, defaultValue, max) => {
  if (value === undefined || value === null || value === "") return defaultValue;

  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) {
    throw new ApiError(400, `${field} must be a positive integer`);
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new ApiError(400, `${field} must be between 1 and ${max}`);
  }

  return parsed;
};

export const parsePagination = (query, { defaultLimit = 20, maxLimit = 50 } = {}) => {
  const page = parseInteger(query.page, "page", 1, MAX_PAGE);
  const limit = parseInteger(query.limit, "limit", defaultLimit, maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};