import type { RequestHandler } from "express";
import { userIdParamsSchema, userListQuerySchema } from "@app/shared";
import { badRequest, notFound } from "../../errors.js";
import {
  deleteUser,
  getUserById,
  listUsers,
  updateUserStatus,
} from "./users.service.js";

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
      next(notFound("Không tìm thấy tài khoản."));
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatusHandler: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const params = userIdParamsSchema.safeParse(req.params);

    if (!params.success) {
      next(badRequest(params.error.issues.map((i) => i.message).join(", ")));
      return;
    }

    const status = req.body?.status;

    if (status !== "ACTIVE" && status !== "LOCKED") {
      next(badRequest("Trạng thái tài khoản không hợp lệ."));
      return;
    }

    const user = await updateUserStatus(params.data.id, status);

    if (!user) {
      next(notFound("Không tìm thấy tài khoản."));
      return;
    }

    res.status(200).json({
      message: "Cập nhật trạng thái tài khoản thành công.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = userIdParamsSchema.safeParse(req.params);

    if (!params.success) {
      next(badRequest(params.error.issues.map((i) => i.message).join(", ")));
      return;
    }

    const deleted = await deleteUser(params.data.id);

    if (!deleted) {
      next(notFound("Không tìm thấy tài khoản."));
      return;
    }

    res.status(200).json({
      message: "Xóa tài khoản thành công.",
    });
  } catch (error) {
    next(error);
  }
};
