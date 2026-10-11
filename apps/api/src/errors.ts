import type { ErrorCode } from "@app/shared";

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message: string) =>
  new AppError(400, "BAD_REQUEST", message);

export const unauthorized = (message = "Not authenticated") =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Forbidden") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Not found") =>
  new AppError(404, "NOT_FOUND", message);

export const conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);
