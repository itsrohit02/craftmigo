export const resolveApiBaseUrl = (configuredUrl, { isProduction }) => {
  const value = typeof configuredUrl === "string" ? configuredUrl.trim() : "";

  if (!value) {
    throw new Error("VITE_API_URL must be set to an HTTPS backend API URL ending in /api or the same-origin /api path.");
  }

  if (value === "/api" || value === "/api/") {
    return "/api";
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_API_URL must be an absolute backend API URL ending in /api or the same-origin /api path.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.replace(/\/+$/, "").endsWith("/api")
  ) {
    throw new Error("VITE_API_URL must be an HTTP(S) backend API URL ending in /api.");
  }

  if (
    isProduction &&
    (url.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname))
  ) {
    throw new Error("Production VITE_API_URL must use HTTPS and cannot point to localhost.");
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
};

export const getSocketBaseUrl = (apiBaseUrl, pageOrigin) => {
  if (apiBaseUrl.startsWith("/")) {
    if (!pageOrigin) {
      throw new Error("A page origin is required when the API URL is same-origin.");
    }
    return new URL("/", pageOrigin).origin;
  }

  const url = new URL(apiBaseUrl);
  url.pathname = url.pathname.replace(/\/api$/, "");
  return url.toString().replace(/\/$/, "");
};
