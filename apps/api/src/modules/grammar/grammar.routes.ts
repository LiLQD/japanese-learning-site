import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  createGrammarHandler,
  getGrammarByIdHandler,
  getGrammarList,
} from "./grammar.controller.js";

const router = Router();

// Reading grammar is public (guests included). Admin write routes (US-30..32)
// must be guarded with requireRole("ADMIN").
router.get("/", getGrammarList);
router.get("/:id", getGrammarByIdHandler);
router.post("/", requireRole("ADMIN"), createGrammarHandler);

export default router;
