import type { RequestHandler } from "express";
import { unauthorized } from "../../errors.js";
import { listFlashcardDecks } from "./flashcards.service.js";

export const getFlashcardDeckList: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (userId === undefined) {
      next(unauthorized());
      return;
    }

    res.status(200).json(await listFlashcardDecks(userId));
  } catch (error) {
    next(error);
  }
};
