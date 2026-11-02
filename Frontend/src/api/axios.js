import axios from "axios";
import { resolveApiBaseUrl } from "../config/apiUrl.js";
import { useAuthStore } from "../store/authStore.js";

const baseURL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL || (import.meta.env.DEV && "http://localhost:5000/api"),
  {
    isProduction: import.meta.env.PROD,
  }
);

const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.request.use((config) => {
  config._authRevision = useAuthStore.getState().authRevision;
  return config;
});

const processQueue = (error) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    if (!originalRequest) return Promise.reject(error);

    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (status === 401 && originalRequest._retry && !isAuthRoute) {
      const authStore = useAuthStore.getState();
      if (originalRequest._authRevision === authStore.authRevision) {
        authStore.clearAuth();
      }
      return Promise.reject(error);
    }

    if (status === 401 && !isAuthRoute) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          const authStore = useAuthStore.getState();
          if (originalRequest._authRevision === authStore.authRevision) {
            authStore.clearAuth();
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
