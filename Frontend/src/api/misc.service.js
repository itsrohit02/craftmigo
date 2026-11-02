import api from "./axios";

export const settingsService = {
  getContact: () => api.get("/settings/contact").then((r) => r.data),
};

export const feedbackService = {
  create: (feedback) => api.post("/feedback", feedback).then((r) => r.data),
};

export const reviewService = {
  create: (data) => api.post("/reviews", data).then((r) => r.data),
  getWorkerReviews: (workerId) => api.get(`/reviews/worker/${workerId}`).then((r) => r.data),
  getMine: () => api.get("/reviews/me").then((r) => r.data),
  moderate: (id, isHidden) => api.patch(`/reviews/${id}/moderate`, { isHidden }).then((r) => r.data),
};

export const notificationService = {
  list: () => api.get("/notifications").then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch("/notifications/read-all").then((r) => r.data),
};

export const searchService = {
  search: (q, type = "all") => api.get("/search", { params: { q, type } }).then((r) => r.data),
};

export const messageService = {
  listConversations: () => api.get("/messages/conversations").then((r) => r.data),
  startConversation: (participantId, bookingId) =>
    api.post("/messages/conversations", { participantId, bookingId }).then((r) => r.data),
  getMessages: (conversationId, params) =>
    api.get(`/messages/conversations/${conversationId}`, { params }).then((r) => r.data),
  sendMessage: (conversationId, text) =>
    api.post(`/messages/conversations/${conversationId}`, { text }).then((r) => r.data),
  respondToRequest: (conversationId, action) =>
    api.patch(`/messages/conversations/${conversationId}/request`, { action }).then((r) => r.data),
};

export const adminService = {
  getDashboard: () => api.get("/admin/dashboard").then((r) => r.data),
  getContactSettings: () => api.get("/settings/contact").then((r) => r.data),
  updateContactSettings: (contact) => api.put("/admin/settings/contact", contact).then((r) => r.data),
  listFeedback: () => api.get("/admin/feedback").then((r) => r.data),
  updateFeedbackStatus: (id, status) =>
    api.patch(`/admin/feedback/${id}/status`, { status }).then((r) => r.data),
  listUsers: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`).then((r) => r.data),
  unblockUser: (id) => api.patch(`/admin/users/${id}/unblock`).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  listPendingVerifications: () => api.get("/admin/workers/pending-verification").then((r) => r.data),
  getVerificationDocumentUrl: (userId, documentId) =>
    `${api.defaults.baseURL.replace(/\/+$/, "")}/admin/workers/${encodeURIComponent(userId)}/verification-documents/${encodeURIComponent(documentId)}`,
  verifyWorker: (userId, approve, note) =>
    api.patch(`/admin/workers/${userId}/verify`, { approve, note }).then((r) => r.data),
  blockWorker: (userId) => api.patch(`/admin/workers/${userId}/block`).then((r) => r.data),
  unblockWorker: (userId) => api.patch(`/admin/workers/${userId}/unblock`).then((r) => r.data),
  listBookings: (params) => api.get("/admin/bookings", { params }).then((r) => r.data),
  listPayments: () => api.get("/admin/payments").then((r) => r.data),
  listReviews: () => api.get("/admin/reviews").then((r) => r.data),
};
