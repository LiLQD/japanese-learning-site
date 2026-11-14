import type { RequestHandler } from "express";
import { badRequest, notFound } from "../../errors.js";
import {
  getReadingPassageById,
  listReadingPassages,
  getReadingQuestionsByPassageId,
  getReadingResultById,
  submitReadingQuiz,
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

    res.status(200).json({
      success: true,
      questions,
    });
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

    res.status(200).json({
      success: true,
      data: result,
    });
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

export const getReadingResult: RequestHandler = async (req, res, next) => {
  try {
    const resultId = Number(req.params.resultId);

    if (!Number.isInteger(resultId) || resultId <= 0) {
      next(badRequest("Mã kết quả bài đọc không hợp lệ."));
      return;
    }

    const result = await getReadingResultById(resultId, req.user!.id);

    if (!result) {
      next(notFound("Không tìm thấy kết quả bài đọc."));
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
