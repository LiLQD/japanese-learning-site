import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { badRequest } from "../errors.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }
    req.body = result.data;
    next();
  };
}
