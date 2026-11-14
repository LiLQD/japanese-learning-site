import type { RequestHandler } from "express";
import { badRequest, notFound } from "../../errors.js";
import {
  getReadingPassageById,
  listReadingPassages,
} from "./reading.service.js";

export const getReadingPassageList: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const result = await listReadingPassages();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getReadingPassageDetail: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      next(badRequest("Mã bài đọc không hợp lệ."));
      return;
    }

    const passage = await getReadingPassageById(id);

    if (!passage) {
      next(notFound("Không tìm thấy bài đọc."));
      return;
    }

    res.status(200).json({ passage });
  } catch (error) {
    next(error);
  }
};
