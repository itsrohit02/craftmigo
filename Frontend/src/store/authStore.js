import { create } from "zustand";
import { authService } from "../api/auth.service";

let initializationPromise;
let authRevision = 0;

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  authRevision: 0,

  setUser: (user) => {
    authRevision += 1;
    set({ user, isAuthenticated: true, isInitializing: false, authRevision });
  },

  clearAuth: () => {
    authRevision += 1;
    set({ user: null, isAuthenticated: false, isInitializing: false, authRevision });
  },

  login: async (credentials) => {
    const res = await authService.login(credentials);
    authRevision += 1;
    set({ user: res.data.user, isAuthenticated: true, isInitializing: false, authRevision });
    return res.data.user;
  },

  register: async (payload) => {
    return authService.register(payload);
  },

  verifyEmail: async (payload) => {
    const res = await authService.verifyEmail(payload);
    authRevision += 1;
    set({ user: res.data.user, isAuthenticated: true, isInitializing: false, authRevision });
    return res.data.user;
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      authRevision += 1;
      set({ user: null, isAuthenticated: false, isInitializing: false, authRevision });
    }
  },

  // Called once on app load to restore session via the refresh-token cookie
  initialize: async () => {
    if (initializationPromise) return initializationPromise;

    const revision = authRevision;
    initializationPromise = authService
      .getMe()
      .then((res) => {
        if (revision === authRevision) {
          set({ user: res.data.user, isAuthenticated: true });
        }
      })
      .catch((error) => {
        const status = error.response?.status;
        if (revision === authRevision && (status === 401 || status === 403)) {
          set({ user: null, isAuthenticated: false });
        }
      })
      .finally(() => {
        if (revision === authRevision) set({ isInitializing: false });
        initializationPromise = null;
      });

    return initializationPromise;
  },
}));
