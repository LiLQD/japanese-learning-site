import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  createKanjiHandler,
  deleteKanjiHandler,
  getKanjiByIdHandler,
  getKanjiList,
  updateKanjiHandler,
} from "./kanji.controller.js";

const router = Router();

// Reading kanji is public (guests included). Every write route must be
// guarded with requireRole("ADMIN").
router.get("/", getKanjiList);
router.get("/:id", getKanjiByIdHandler);
router.post("/", requireRole("ADMIN"), createKanjiHandler);
router.put("/:id", requireRole("ADMIN"), updateKanjiHandler);
router.delete("/:id", requireRole("ADMIN"), deleteKanjiHandler);

export default router;
