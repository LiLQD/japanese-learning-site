import type { RequestHandler } from "express";
import type { z } from "zod";
import {
  wordIdSchema,
  wordListQuerySchema,
  createWordSchema,
} from "@app/shared";
import { badRequest } from "../../errors.js";
import {
  getWordById,
  listWords,
  createWord,
  updateWord,
} from "./words.service.js";

function issuesMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(", ");
}

export const getWordList: RequestHandler = async (req, res, next) => {
  try {
    const result = wordListQuerySchema.safeParse(req.query);

    if (!result.success) {
      next(badRequest(issuesMessage(result.error)));
      return;
    }

    res.status(200).json(await listWords(result.data));
  } catch (error) {
    next(error);
  }
};

export const getWordByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = wordIdSchema.safeParse(req.params);

    if (!params.success) {
      next(badRequest(issuesMessage(params.error)));
      return;
    }

    res.status(200).json({ word: await getWordById(params.data.id) });
  } catch (error) {
    next(error);
  }
};

export const postWord: RequestHandler = async (req, res, next) => {
  try {
    const result = createWordSchema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      return next(badRequest(message));
    }

    const word = await createWord(result.data);
    res.status(201).json({ word });
  } catch (error) {
    next(error);
  }
};
export const putWord: RequestHandler = async (req, res, next) => {
  try {
    const params = wordIdSchema.safeParse(req.params);
    if (!params.success) {
      return next(badRequest(issuesMessage(params.error)));
    }

    const result = createWordSchema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      return next(badRequest(message));
    }

    const word = await updateWord(params.data.id, result.data);
    res.status(200).json({ word });
  } catch (error) {
    next(error);
  }
};
