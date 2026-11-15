import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  getReadingPassageDetail,
  getReadingPassageList,
  postReading,
  putReading,
  deleteReadingHandler,
} from "./reading.controller.js";

const router = Router();

router.get("/", getReadingPassageList);
router.get("/:id", getReadingPassageDetail);

router.post("/", requireRole("ADMIN"), postReading);
router.put("/:id", requireRole("ADMIN"), putReading);
router.delete("/:id", requireRole("ADMIN"), deleteReadingHandler);

export default router;
