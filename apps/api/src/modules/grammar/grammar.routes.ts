import { Router } from "express";
import { getGrammarList } from "./grammar.controller.js";

const router = Router();

// Reading grammar is public (guests included). Admin write routes (US-30..32)
// must be guarded with requireRole("ADMIN").
router.get("/", getGrammarList);

export default router;
