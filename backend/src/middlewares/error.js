import { ApiError } from "../utils/api.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found."));
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (statusCode >= 500) {
    console.error("[backend:error]", error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details,
  });
}
