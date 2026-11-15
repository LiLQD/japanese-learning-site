import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  getReadingPassageDetail,
  getReadingPassageList,
  getReadingQuestions,
  submitReading,
  postReading,
  putReading,
  deleteReadingHandler,
} from "./reading.controller.js";

const router = Router();

// --- Public routes & Quiz routes ---
router.get("/", getReadingPassageList);
router.get("/:id", getReadingPassageDetail);
router.get("/:id/questions", getReadingQuestions);
router.post("/submit", requireAuth, submitReading);

// --- Admin routes ---
router.post("/", requireRole("ADMIN"), postReading);
router.put("/:id", requireRole("ADMIN"), putReading);
router.delete("/:id", requireRole("ADMIN"), deleteReadingHandler);

export default router;
