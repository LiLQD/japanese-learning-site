import type { RequestHandler } from "express";
import type { z } from "zod";
import {
  kanjiIdParamSchema,
  kanjiInputSchema,
  kanjiListQuerySchema,
} from "@app/shared";
import { badRequest } from "../../errors.js";
import {
  createKanji,
  getKanjiById,
  listKanji,
  updateKanji,
} from "./kanji.service.js";

function issuesMessage(error: z.ZodError) {
  return error.issues.map((i) => i.message).join(", ");
}

export const getKanjiList: RequestHandler = async (req, res, next) => {
  try {
    const result = kanjiListQuerySchema.safeParse(req.query);

    if (!result.success) {
      next(badRequest(issuesMessage(result.error)));
      return;
    }

    res.status(200).json(await listKanji(result.data));
  } catch (error) {
    next(error);
  }
};

export const getKanjiByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = kanjiIdParamSchema.safeParse(req.params);

    if (!params.success) {
      next(badRequest(issuesMessage(params.error)));
      return;
    }

    res.status(200).json({ kanji: await getKanjiById(params.data.id) });
  } catch (error) {
    next(error);
  }
};

export const createKanjiHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = kanjiInputSchema.safeParse(req.body);

    if (!result.success) {
      next(badRequest(issuesMessage(result.error)));
      return;
    }

    res.status(201).json({ kanji: await createKanji(result.data) });
  } catch (error) {
    next(error);
  }
};

export const updateKanjiHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = kanjiIdParamSchema.safeParse(req.params);

    if (!params.success) {
      next(badRequest(issuesMessage(params.error)));
      return;
    }

    const body = kanjiInputSchema.safeParse(req.body);

    if (!body.success) {
      next(badRequest(issuesMessage(body.error)));
      return;
    }

    res
      .status(200)
      .json({ kanji: await updateKanji(params.data.id, body.data) });
  } catch (error) {
    next(error);
  }
};
