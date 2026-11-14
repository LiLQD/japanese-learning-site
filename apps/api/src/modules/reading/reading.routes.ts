import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getReadingPassageDetail,
  getReadingPassageList,
  getReadingQuestions,
  submitReading,
} from "./reading.controller.js";

const router = Router();

router.get("/", getReadingPassageList);
router.get("/:id", getReadingPassageDetail);
router.get("/:id/questions", getReadingQuestions);

router.post("/submit", requireAuth, submitReading);

export default router;
