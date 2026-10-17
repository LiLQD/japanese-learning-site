import type { RequestHandler } from "express";
import { userIdParamsSchema, userListQuerySchema } from "@app/shared";
import { badRequest, notFound } from "../../errors.js";
import { getUserById, listUsers } from "./users.service.js";

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

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const result = userIdParamsSchema.safeParse(req.params);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    const user = await getUserById(result.data.id);
    if (!user) {
      next(notFound("Không tìm thấy người dùng"));
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
