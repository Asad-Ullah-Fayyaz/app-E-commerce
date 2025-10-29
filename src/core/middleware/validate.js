import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ZodError } from "zod";

const validate = (schema) =>
  asyncHandler(async (req, res, next) => {
    try {
      // 🚨 Check if request body exists
      if (!req.body || typeof req.body !== "object") {
        throw new ApiError(400, "Invalid input: expected object, received undefined");
      }

      // 🧩 Handle single or multiple schema validation
      if (schema?.safeParse) {
        schema.parse(req.body);
      } else {
        if (schema?.body) schema.body.parse(req.body);
        if (schema?.query) schema.query.parse(req.query);
        if (schema?.params) schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodErrors = error.issues || error.errors || [];

        const formattedErrors = zodErrors.map((err) => ({
          field: err?.path?.join(".") || "unknown",
          message: err?.message || "Invalid input",
        }));

        throw new ApiError(400, "Validation failed", formattedErrors);
      }

      console.error("Unexpected validation error:", error);
      throw new ApiError(500, "Unexpected validation error", [
        { message: error.message },
      ]);
    }
  });

export { validate };
