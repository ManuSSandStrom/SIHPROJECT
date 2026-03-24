import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Use this constant for all API calls: axios.get(`${API}/api/...`)
export const API = import.meta.env.VITE_API_URL;

// Helper for consistent error logging (Task B)
export const logError = (error, context = "API Error") => {
  console.error(`${context}:`, {
    message: error?.message,
    status: error?.response?.status,
    data: error?.response?.data,
    stack: error?.stack
  });
};
