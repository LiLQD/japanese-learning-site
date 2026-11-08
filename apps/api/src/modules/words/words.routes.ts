import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  getWordByIdHandler,
  getWordList,
  postWord,
  putWord,
  deleteWordHandler,
} from "./words.controller.js";

const router = Router();

// Public routes
router.get("/", getWordList);
router.get("/:id", getWordByIdHandler);

// Admin routes
router.post("/", requireRole("ADMIN"), postWord);
router.put("/:id", requireRole("ADMIN"), putWord);
router.delete("/:id", requireRole("ADMIN"), deleteWordHandler);

export default router;
