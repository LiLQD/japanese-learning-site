import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  getReadingPassageList,
  getReadingPassageDetail,
  getReadingQuestions,
  submitReading,
  postReading,
  putReading,
  deleteReadingHandler,
  getReadingResultHandler,
} from "./reading.controller.js";

const router = Router();

// --- Public & Auth routes ---
router.get("/", getReadingPassageList);
router.get("/:id", getReadingPassageDetail);
router.get("/:id/questions", getReadingQuestions);
router.post("/submit", requireAuth, submitReading);
router.get("/results/:id", requireAuth, getReadingResultHandler);

// --- Admin routes ---
router.post("/", requireRole("ADMIN"), postReading);
router.put("/:id", requireRole("ADMIN"), putReading);
router.delete("/:id", requireRole("ADMIN"), deleteReadingHandler);

export default router;
