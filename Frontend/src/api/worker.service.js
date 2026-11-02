import api from "./axios";

export const workerService = {
  listWorkers: (params) => api.get("/workers", { params }).then((r) => r.data),
  getPublicProfile: (id) => api.get(`/workers/${id}`).then((r) => r.data),
  getMyProfile: () => api.get("/workers/me/profile").then((r) => r.data),
  updateMyProfile: (data) => api.patch("/workers/me/profile", data).then((r) => r.data),
  toggleAvailability: () => api.patch("/workers/me/availability").then((r) => r.data),
  addPortfolioItem: (formData) =>
    api.post("/workers/me/portfolio", formData).then((r) => r.data),
  removePortfolioItem: (itemId) => api.delete(`/workers/me/portfolio/${itemId}`).then((r) => r.data),
  submitVerification: (formData) =>
    api.post("/workers/me/verification", formData).then((r) => r.data),
};
