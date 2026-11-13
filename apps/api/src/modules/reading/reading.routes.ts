import { Router } from "express";
import { getReadingPassageList } from "./reading.controller.js";

const router = Router();

router.get("/", getReadingPassageList);

export default router;
