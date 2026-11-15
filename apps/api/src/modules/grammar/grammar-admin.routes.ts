import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  getAdminGrammarByIdHandler,
  deleteGrammarHandler,
  getGrammarList,
  updateGrammarHandler,
} from "./grammar.controller.js";

const router = Router();

router.get("/", requireRole("ADMIN"), getGrammarList);
router.get("/:id", requireRole("ADMIN"), getAdminGrammarByIdHandler);
router.patch("/:id", requireRole("ADMIN"), updateGrammarHandler);
router.delete("/:id", requireRole("ADMIN"), deleteGrammarHandler);

export default router;
