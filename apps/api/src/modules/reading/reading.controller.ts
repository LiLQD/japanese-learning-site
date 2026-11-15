import type { RequestHandler } from "express";
import { badRequest, notFound } from "../../errors.js";
import { readingInputSchema } from "@app/shared";
import {
  getReadingPassageById,
  listReadingPassages,
  getReadingQuestionsByPassageId,
  submitReadingQuiz,
  createReading,
  updateReading,
  deleteReading,
  getReadingResultById,
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

export const getReadingQuestions: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      next(badRequest("Mã bài đọc không hợp lệ."));
      return;
    }
    const questions = await getReadingQuestionsByPassageId(id);
    if (!questions) {
      next(notFound("Không tìm thấy bài đọc."));
      return;
    }
    res.status(200).json({ success: true, questions });
  } catch (error) {
    next(error);
  }
};

export const submitReading: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { passageId, timeSpent, answers } = req.body ?? {};
    const parsedPassageId = Number(passageId);
    const parsedTimeSpent = Number(timeSpent ?? 0);

    if (!Number.isInteger(parsedPassageId) || parsedPassageId <= 0) {
      next(badRequest("Mã bài đọc không hợp lệ."));
      return;
    }
    if (!Number.isFinite(parsedTimeSpent) || parsedTimeSpent < 0) {
      next(badRequest("Thời gian làm bài không hợp lệ."));
      return;
    }
    if (!Array.isArray(answers)) {
      next(badRequest("Danh sách câu trả lời không hợp lệ."));
      return;
    }

    const validAnswers = answers.every(
      (answer) =>
        answer &&
        Number.isInteger(Number(answer.questionId)) &&
        Number(answer.questionId) > 0 &&
        Number.isInteger(Number(answer.selectedOption)) &&
        Number(answer.selectedOption) >= 0,
    );

    if (!validAnswers) {
      next(badRequest("Thông tin câu trả lời không hợp lệ."));
      return;
    }

    const result = await submitReadingQuiz(
      userId,
      parsedPassageId,
      parsedTimeSpent,
      answers.map((answer) => ({
        questionId: Number(answer.questionId),
        selectedOption: Number(answer.selectedOption),
      })),
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Bài đọc chưa có câu hỏi."
    ) {
      next(badRequest(error.message));
      return;
    }
    next(error);
  }
};

export const getReadingResultHandler: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      next(badRequest("Mã kết quả không hợp lệ."));
      return;
    }
    const result = await getReadingResultById(id, req.user!.id);
    res.status(200).json({ success: true, data: result });
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
