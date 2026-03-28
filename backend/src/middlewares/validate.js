import { ApiError } from "../utils/api.js";

export function validate(schema, target = "body") {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      return next(
        new ApiError(400, "Validation failed.", parsed.error.flatten()),
      );
    }

    req[target] = parsed.data;
    return next();
  };
}
