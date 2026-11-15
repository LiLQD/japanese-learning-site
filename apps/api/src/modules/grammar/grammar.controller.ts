import type { RequestHandler } from "express";
import {
  grammarCreateInputSchema,
  grammarIdParamSchema,
  grammarListQuerySchema,
  grammarUpdateInputSchema,
} from "@app/shared";
import { badRequest } from "../../errors.js";
import {
  createGrammar,
  deleteGrammar,
  getAdminGrammarById,
  getGrammarById,
  listGrammars,
  updateGrammar,
} from "./grammar.service.js";

export const createGrammarHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = grammarCreateInputSchema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    res.status(201).json({ grammar: await createGrammar(result.data) });
  } catch (error) {
    next(error);
  }
};

export const getGrammarList: RequestHandler = async (req, res, next) => {
  try {
    const result = grammarListQuerySchema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    res.status(200).json(await listGrammars(result.data));
  } catch (error) {
    next(error);
  }
};

export const getGrammarByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = grammarIdParamSchema.safeParse(req.params);

    if (!params.success) {
      const message = params.error.issues.map((i) => i.message).join(", ");
      next(badRequest(message));
      return;
    }

    res.status(200).json({ grammar: await getGrammarById(params.data.id) });
  } catch (error) {
    next(error);
  }
};

export const getAdminGrammarByIdHandler: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const params = grammarIdParamSchema.safeParse(req.params);
    if (!params.success) {
      const message = params.error.issues
        .map((issue) => issue.message)
        .join(", ");
      next(badRequest(message));
      return;
    }

    res
      .status(200)
      .json({ grammar: await getAdminGrammarById(params.data.id) });
  } catch (error) {
    next(error);
  }
};

export const updateGrammarHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = grammarIdParamSchema.safeParse(req.params);
    if (!params.success) {
      const message = params.error.issues
        .map((issue) => issue.message)
        .join(", ");
      next(badRequest(message));
      return;
    }

    const input = grammarUpdateInputSchema.safeParse(req.body);
    if (!input.success) {
      const message = input.error.issues
        .map((issue) => issue.message)
        .join(", ");
      next(badRequest(message));
      return;
    }

    res.status(200).json({
      grammar: await updateGrammar(params.data.id, input.data),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGrammarHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = grammarIdParamSchema.safeParse(req.params);
    if (!params.success) {
      const message = params.error.issues
        .map((issue) => issue.message)
        .join(", ");
      next(badRequest(message));
      return;
    }

    await deleteGrammar(params.data.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
