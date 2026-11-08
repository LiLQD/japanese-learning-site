import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  getWordByIdHandler,
  getWordList,
  postWord,
} from "./words.controller.js";

const router = Router();

// Public routes
router.get("/", getWordList);
router.get("/:id", getWordByIdHandler);

// Admin routes
router.post("/", requireRole("ADMIN"), postWord);

export default router;
