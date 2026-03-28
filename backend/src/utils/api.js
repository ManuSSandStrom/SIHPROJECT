export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler =
  (handler) =>
  async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export function sendSuccess(res, data, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function buildPagination(query = {}) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function getSort(query = {}, fallback = "-createdAt") {
  return query.sort || fallback;
}

export function toPlain(model) {
  if (!model) {
    return null;
  }

  if (Array.isArray(model)) {
    return model.map((item) =>
      typeof item?.toObject === "function" ? item.toObject() : item,
    );
  }

  return typeof model?.toObject === "function" ? model.toObject() : model;
}
