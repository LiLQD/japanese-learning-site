import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getReadingPassageDetail,
  getReadingPassageList,
  getReadingQuestions,
  submitReading,
  getReadingResult,
} from "./reading.controller.js";

const router = Router();
router.get("/results/:resultId", requireAuth, getReadingResult);
router.get("/", getReadingPassageList);
router.get("/:id", getReadingPassageDetail);
router.get("/:id/questions", getReadingQuestions);

router.post("/submit", requireAuth, submitReading);

export default router;
