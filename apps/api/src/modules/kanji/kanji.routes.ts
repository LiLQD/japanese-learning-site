import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { createKanjiHandler, getKanjiList } from "./kanji.controller.js";

const router = Router();

// Reading kanji is public (guests included). Every write route must be
// guarded with requireRole("ADMIN").
router.get("/", getKanjiList);
router.post("/", requireRole("ADMIN"), createKanjiHandler);

export default router;
