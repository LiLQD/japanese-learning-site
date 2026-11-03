import type { RequestHandler } from "express";
import { kanjiInputSchema, kanjiListQuerySchema } from "@app/shared";
import { badRequest } from "../../errors.js";
import { createKanji, listKanji } from "./kanji.service.js";

export const getKanjiList: RequestHandler = async (req, res, next) => {
  try {
    const result = kanjiListQuerySchema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    res.status(200).json(await listKanji(result.data));
  } catch (error) {
    next(error);
  }
};

export const createKanjiHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = kanjiInputSchema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    res.status(201).json({ kanji: await createKanji(result.data) });
  } catch (error) {
    next(error);
  }
};
