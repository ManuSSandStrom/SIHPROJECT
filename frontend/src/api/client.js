import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const NON_REFRESHABLE_AUTH_PATHS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/student/register",
  "/auth/faculty/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/reset-password/otp",
];

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

function shouldSkipRefresh(config) {
  const url = config?.url || "";
  return NON_REFRESHABLE_AUTH_PATHS.some((path) => url.includes(path));
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.config &&
      !error.config.__isRetryRequest &&
      !shouldSkipRefresh(error.config)
    ) {
      try {
        error.config.__isRetryRequest = true;
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        useAuthStore.getState().setSession(response.data.data);
        error.config.headers = error.config.headers || {};
        error.config.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return api.request(error.config);
      } catch {
        useAuthStore.getState().clearSession();
      }
    }

    return Promise.reject(error);
  },
);

export async function unwrap(promise) {
  const response = await promise;
  return response.data.data;
}
