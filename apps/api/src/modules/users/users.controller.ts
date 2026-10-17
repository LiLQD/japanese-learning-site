import type { RequestHandler } from "express";
import { userListQuerySchema } from "@app/shared";
import { badRequest } from "../../errors.js";
import { listUsers } from "./users.service.js";

export const getUsers: RequestHandler = async (req, res, next) => {
  try {
    const result = userListQuerySchema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    res.status(200).json(await listUsers(result.data));
  } catch (error) {
    next(error);
  }
};
