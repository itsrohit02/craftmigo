const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && configuredOrigins.length === 0) {
  throw new Error("CLIENT_URL must contain the production frontend origin(s)");
}

const parseOrigin = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid CLIENT_URL origin: ${value}`);
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`CLIENT_URL must contain only an origin: ${value}`);
  }

  if (isProduction && url.protocol !== "https:") {
    throw new Error(`Production CLIENT_URL must use HTTPS: ${value}`);
  }

  return url.origin;
};

const configured = configuredOrigins.map(parseOrigin);
const developmentOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://localhost:5174"];

export const allowedOrigins = [...new Set([...configured, ...developmentOrigins])];

export const isAllowedOrigin = (origin) => !origin || allowedOrigins.includes(origin);
