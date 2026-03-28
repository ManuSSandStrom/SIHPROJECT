import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config.__isRetryRequest) {
      try {
        error.config.__isRetryRequest = true;
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        useAuthStore.getState().setSession(response.data.data);
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
