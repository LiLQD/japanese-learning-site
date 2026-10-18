import type { RequestHandler } from "express";
import { updateProfileSchema } from "@app/shared";
import { badRequest, notFound } from "../../errors.js";
import { getProfile, updateProfile } from "./profile.service.js";

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
