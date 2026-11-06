import type { RequestHandler } from "express";
import type { z } from "zod";
import { wordIdSchema, wordListQuerySchema } from "@app/shared";
import { badRequest } from "../../errors.js";
import { getWordById, listWords } from "./words.service.js";

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
