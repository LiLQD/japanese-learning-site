import type { RequestHandler } from "express";
import { badRequest, notFound } from "../../errors.js";
import { readingInputSchema } from "@app/shared";
import {
  getReadingPassageById,
  listReadingPassages,
  createReading,
  updateReading,
  deleteReading,
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

export const postReading: RequestHandler = async (req, res, next) => {
  try {
    const result = readingInputSchema.safeParse(req.body);
    if (!result.success) {
      return next(
        badRequest(result.error.issues.map((i) => i.message).join(", ")),
      );
    }

    const reading = await createReading(result.data);
    res.status(201).json({ reading });
  } catch (error) {
    if (error instanceof Error && error.message === "Bài đọc đã tồn tại") {
      return next(badRequest(error.message));
    }
    next(error);
  }
};

export const putReading: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = readingInputSchema.safeParse(req.body);

    if (!result.success) {
      return next(
        badRequest(result.error.issues.map((i) => i.message).join(", ")),
      );
    }

    const reading = await updateReading(id, result.data);
    res.status(200).json({ reading });
  } catch (error) {
    next(error);
  }
};

export const deleteReadingHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await deleteReading(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
