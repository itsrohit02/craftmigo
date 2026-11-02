import api from "./axios";

export const userService = {
  updateProfile: (data) => api.patch("/users/profile", data).then((r) => r.data),
  updateAvatar: (formData) =>
    api.patch("/users/avatar", formData).then((r) => r.data),
  getFavorites: () => api.get("/users/favorites").then((r) => r.data),
  addFavoriteService: (serviceId) => api.post(`/users/favorites/services/${serviceId}`).then((r) => r.data),
  removeFavoriteService: (serviceId) => api.delete(`/users/favorites/services/${serviceId}`).then((r) => r.data),
  addFavoriteWorker: (workerId) => api.post(`/users/favorites/workers/${workerId}`).then((r) => r.data),
  removeFavoriteWorker: (workerId) => api.delete(`/users/favorites/workers/${workerId}`).then((r) => r.data),
};
