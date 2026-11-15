import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { errorResponseSchema } from "@app/shared";
import { AppError, databaseUnavailable } from "../errors.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(
    errorResponseSchema.parse({
      error: { code: "NOT_FOUND", message: "Not found" },
    }),
  );
};

const DATABASE_CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "P1001",
  "P1002",
  "P1017",
]);

function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; cause?: unknown };
  if (
    typeof candidate.code === "string" &&
    DATABASE_CONNECTION_ERROR_CODES.has(candidate.code)
  ) {
    return true;
  }

  return (
    candidate.cause !== error && isDatabaseConnectionError(candidate.cause)
  );
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
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

  if (
    req.method === "POST" &&
    req.path === "/api/grammar" &&
    isDatabaseConnectionError(err)
  ) {
    const error = databaseUnavailable();
    res.status(error.status).json(
      errorResponseSchema.parse({
        error: { code: error.code, message: error.message },
      }),
    );
    return;
  }

  if (
    req.originalUrl.startsWith("/api/admin/grammar") &&
    isDatabaseConnectionError(err)
  ) {
    res.status(500).json(
      errorResponseSchema.parse({
        error: { code: "INTERNAL", message: "Lỗi kết nối!" },
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
