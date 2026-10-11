import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { errorResponseSchema } from "@app/shared";
import { AppError } from "../errors.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(
    errorResponseSchema.parse({
      error: { code: "NOT_FOUND", message: "Not found" },
    }),
  );
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(
      errorResponseSchema.parse({
        error: { code: err.code, message: err.message },
      }),
    );
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join(", ");
    res.status(400).json(
      errorResponseSchema.parse({
        error: { code: "BAD_REQUEST", message },
      }),
    );
    return;
  }

  console.error(err);
  res.status(500).json(
    errorResponseSchema.parse({
      error: { code: "INTERNAL", message: "Internal server error" },
    }),
  );
};
