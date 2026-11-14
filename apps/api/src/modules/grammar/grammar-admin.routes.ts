import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { getGrammarList } from "./grammar.controller.js";

const router = Router();

router.get("/", requireRole("ADMIN"), getGrammarList);

export default router;
