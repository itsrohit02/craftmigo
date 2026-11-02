import api from "./axios";

export const bookingService = {
  create: (data) => api.post("/bookings", data).then((r) => r.data),
  getCustomerBookings: (params) => api.get("/bookings/customer", { params }).then((r) => r.data),
  getWorkerBookings: (params) => api.get("/bookings/worker", { params }).then((r) => r.data),
  getById: (id) => api.get(`/bookings/${id}`).then((r) => r.data),
  accept: (id) => api.patch(`/bookings/${id}/accept`).then((r) => r.data),
  reject: (id, reason) => api.patch(`/bookings/${id}/reject`, { reason }).then((r) => r.data),
  markOnTheWay: (id) => api.patch(`/bookings/${id}/on-the-way`).then((r) => r.data),
  start: (id) => api.patch(`/bookings/${id}/start`).then((r) => r.data),
  complete: (id) => api.patch(`/bookings/${id}/complete`).then((r) => r.data),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),
  pay: (id) => api.patch(`/bookings/${id}/pay`).then((r) => r.data),
};
