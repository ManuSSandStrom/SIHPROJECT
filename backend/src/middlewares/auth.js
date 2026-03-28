import { User } from "../models/index.js";
import { ApiError, asyncHandler } from "../utils/api.js";
import { verifyAccessToken } from "../utils/security.js";

export const protectRoute = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  if (!token) {
    throw new ApiError(401, "Authentication token is required.");
  }

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(401, "User not found for this token.");
  }

  req.user = user;
  next();
});

export function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You are not allowed to access this resource."));
    }

    return next();
  };
}
