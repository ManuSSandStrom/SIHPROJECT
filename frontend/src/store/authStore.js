import { create } from "zustand";
import { api, unwrap } from "../api/client";

const STORAGE_KEY = "smart-classroom-auth";

function readStoredState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useAuthStore = create((set, get) => ({
  user: readStoredState().user || null,
  accessToken: readStoredState().accessToken || "",
  loading: false,
  initialized: false,
  setSession: ({ user, accessToken }) => {
    const next = { user, accessToken };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set(next);
  },
  clearSession: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: "" });
  },
  bootstrapSession: async () => {
    if (get().initialized) {
      return;
    }

    set({ loading: true });
    try {
      if (get().accessToken) {
        const user = await unwrap(api.get("/auth/me"));
        set({ user, initialized: true, loading: false });
        return;
      }

      const session = await unwrap(api.post("/auth/refresh"));
      get().setSession(session);
      set({ initialized: true, loading: false });
    } catch {
      get().clearSession();
      set({ initialized: true, loading: false });
    }
  },
}));
