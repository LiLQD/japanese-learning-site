import type { RequestHandler } from "express";
import { updateProfileSchema, changePasswordSchema } from "@app/shared";
import { updateAvatar } from "./profile.service.js";
import { badRequest, notFound } from "../../errors.js";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "./profile.service.js";

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = await getProfile(req.user!.id);
    if (!user) return next(notFound("Không tìm thấy người dùng"));
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateMe: RequestHandler = async (req, res, next) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      return next(badRequest(message));
    }

    const user = await updateProfile(req.user!.id, result.data);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  try {
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      return next(badRequest(message));
    }

    await changePassword(
      req.user!.id,
      result.data.oldPassword,
      result.data.newPassword,
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(badRequest("Vui lòng chọn file ảnh"));
    }
    const user = await updateAvatar(req.user!.id, req.file.filename);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
