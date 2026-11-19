import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getFlashcardDeckDetail,
  getFlashcardDeckList,
  patchFlashcard,
  postFlashcard,
  postFlashcardDeck,
  removeFlashcard,
} from "./flashcards.controller.js";

const router = Router();

router.get("/decks", requireAuth, getFlashcardDeckList);
router.get("/decks/:deckId", requireAuth, getFlashcardDeckDetail);
router.post("/decks", requireAuth, postFlashcardDeck);
router.post("/decks/:deckId/cards", requireAuth, postFlashcard);
router.patch("/decks/:deckId/cards/:cardId", requireAuth, patchFlashcard);
router.delete("/decks/:deckId/cards/:cardId", requireAuth, removeFlashcard);

export default router;
