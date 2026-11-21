import type { RequestHandler } from "express";
import {
  flashcardCardCreateInputSchema,
  flashcardCardParamsSchema,
  flashcardCardUpdateInputSchema,
  flashcardDeckCreateInputSchema,
  flashcardDeckIdParamSchema,
} from "@app/shared";
import { badRequest, unauthorized } from "../../errors.js";
import {
  createFlashcard,
  createFlashcardDeck,
  deleteFlashcard,
  getFlashcardDeck,
  getFlashcardDeckForLearning as loadFlashcardDeckForLearning,
  listFlashcardDecks,
  updateFlashcard,
} from "./flashcards.service.js";

function getUserId(req: Parameters<RequestHandler>[0]) {
  const userId = req.user?.id;
  if (userId === undefined) {
    throw unauthorized();
  }
  return userId;
}

function validationMessage(result: {
  error: { issues: { message: string }[] };
}) {
  return result.error.issues.map((issue) => issue.message).join(", ");
}

export const getFlashcardDeckList: RequestHandler = async (req, res, next) => {
  try {
    res.status(200).json(await listFlashcardDecks(getUserId(req)));
  } catch (error) {
    next(error);
  }
};

export const getFlashcardDeckDetail: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const params = flashcardDeckIdParamSchema.safeParse(req.params);
    if (!params.success) {
      next(badRequest(validationMessage(params)));
      return;
    }

    res
      .status(200)
      .json(await getFlashcardDeck(getUserId(req), params.data.deckId));
  } catch (error) {
    next(error);
  }
};

export const getFlashcardDeckForLearning: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const params = flashcardDeckIdParamSchema.safeParse(req.params);
    if (!params.success) {
      next(badRequest(validationMessage(params)));
      return;
    }

    res
      .status(200)
      .json(
        await loadFlashcardDeckForLearning(getUserId(req), params.data.deckId),
      );
  } catch (error) {
    next(error);
  }
};

export const postFlashcardDeck: RequestHandler = async (req, res, next) => {
  try {
    const input = flashcardDeckCreateInputSchema.safeParse(req.body);
    if (!input.success) {
      next(badRequest(validationMessage(input)));
      return;
    }

    res
      .status(201)
      .json({ deck: await createFlashcardDeck(getUserId(req), input.data) });
  } catch (error) {
    next(error);
  }
};

export const postFlashcard: RequestHandler = async (req, res, next) => {
  try {
    const params = flashcardDeckIdParamSchema.safeParse(req.params);
    const input = flashcardCardCreateInputSchema.safeParse(req.body);
    if (!params.success || !input.success) {
      next(
        badRequest(
          [
            !params.success ? validationMessage(params) : "",
            !input.success ? validationMessage(input) : "",
          ]
            .filter(Boolean)
            .join(", "),
        ),
      );
      return;
    }

    res.status(201).json({
      card: await createFlashcard(
        getUserId(req),
        params.data.deckId,
        input.data,
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const patchFlashcard: RequestHandler = async (req, res, next) => {
  try {
    const params = flashcardCardParamsSchema.safeParse(req.params);
    const input = flashcardCardUpdateInputSchema.safeParse(req.body);
    if (!params.success || !input.success) {
      next(
        badRequest(
          [
            !params.success ? validationMessage(params) : "",
            !input.success ? validationMessage(input) : "",
          ]
            .filter(Boolean)
            .join(", "),
        ),
      );
      return;
    }

    res.status(200).json({
      card: await updateFlashcard(
        getUserId(req),
        params.data.deckId,
        params.data.cardId,
        input.data,
      ),
    });
  } catch (error) {
    next(error);
  }
};

export const removeFlashcard: RequestHandler = async (req, res, next) => {
  try {
    const params = flashcardCardParamsSchema.safeParse(req.params);
    if (!params.success) {
      next(badRequest(validationMessage(params)));
      return;
    }

    await deleteFlashcard(
      getUserId(req),
      params.data.deckId,
      params.data.cardId,
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
