import { create } from "zustand";
import { authService } from "../api/auth.service";

let initializationPromise;

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  clearAuth: () => set({ user: null, isAuthenticated: false }),

  login: async (credentials) => {
    const res = await authService.login(credentials);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data.user;
  },

  register: async (payload) => {
    return authService.register(payload);
  },

  verifyEmail: async (payload) => {
    const res = await authService.verifyEmail(payload);
    set({ user: res.data.user, isAuthenticated: true });
    return res.data.user;
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  // Called once on app load to restore session via the refresh-token cookie
  initialize: async () => {
    if (initializationPromise) return initializationPromise;

    initializationPromise = authService
      .getMe()
      .then((res) => {
        set({ user: res.data.user, isAuthenticated: true });
      })
      .catch((error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          set({ user: null, isAuthenticated: false });
        }
      })
      .finally(() => {
        set({ isInitializing: false });
        initializationPromise = null;
      });

    return initializationPromise;
  },
}));
