import type { RequestHandler } from "express";
import type { AuthUser, Role } from "../types.js";
import { forbidden, unauthorized } from "../errors.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(unauthorized());
    return;
  }
  next();
};

export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    const user: AuthUser | undefined = req.user;
    if (!user) {
      next(unauthorized());
      return;
    }
    if (!allowed.includes(user.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}
