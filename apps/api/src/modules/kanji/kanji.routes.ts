import { Router } from "express";
import { getKanjiList } from "./kanji.controller.js";

const router = Router();

// Reading kanji is public (guests included). Write routes added later must
// be guarded with requireRole("ADMIN").
router.get("/", getKanjiList);

export default router;
