import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getFlashcardDeckList } from "./flashcards.controller.js";

const router = Router();

router.get("/decks", requireAuth, getFlashcardDeckList);

export default router;
