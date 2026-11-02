import api from "./axios";

export const authService = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  verifyEmail: (data) => api.post("/auth/verify-email", data).then((r) => r.data),
  resendEmailVerificationCode: (email) => api.post("/auth/resend-verification", { email }).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  getMe: () => api.get("/auth/me").then((r) => r.data),
  changePassword: (data) => api.patch("/auth/change-password", data).then((r) => r.data),
  requestPasswordReset: (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (data) => api.patch("/auth/reset-password", data).then((r) => r.data),
};
