import type { RequestHandler } from "express";
import { grammarIdParamSchema, grammarListQuerySchema } from "@app/shared";
import { badRequest } from "../../errors.js";
import { getGrammarById, listGrammars } from "./grammar.service.js";

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
