import { Router } from "express";
import {
  getReadingPassageDetail,
  getReadingPassageList,
} from "./reading.controller.js";

const router = Router();

router.get("/", getReadingPassageList);
router.get("/:id", getReadingPassageDetail);

export default router;
