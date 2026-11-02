import api from "./axios";

export const serviceService = {
  list: (params) => api.get("/services", { params }).then((r) => r.data),
  getById: (id) => api.get(`/services/${id}`).then((r) => r.data),
  getByWorker: (workerId) => api.get(`/services/worker/${workerId}`).then((r) => r.data),
  getMine: () => api.get("/services/me/mine").then((r) => r.data),
  create: (formData) =>
    api.post("/services", formData).then((r) => r.data),
  update: (id, formData) =>
    api.patch(`/services/${id}`, formData).then((r) => r.data),
  removeImage: (id, publicId) =>
    api.delete(`/services/${id}/images/${encodeURIComponent(publicId)}`).then((r) => r.data),
  toggleActive: (id) => api.patch(`/services/${id}/toggle-active`).then((r) => r.data),
  remove: (id) => api.delete(`/services/${id}`).then((r) => r.data),
};

export const categoryService = {
  list: (all = false) => api.get("/categories", { params: { all } }).then((r) => r.data),
  create: (data) => api.post("/categories", data).then((r) => r.data),
  update: (id, data) => api.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};
