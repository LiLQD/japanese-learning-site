import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  getWordByIdHandler,
  getWordList,
  postWord,
  putWord,
} from "./words.controller.js";

const router = Router();

// Public routes
router.get("/", getWordList);
router.get("/:id", getWordByIdHandler);

// Admin routes
router.post("/", requireRole("ADMIN"), postWord);
router.put("/:id", requireRole("ADMIN"), putWord);

export default router;
