import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { getDashboardStatisticsHandler } from "./dashboard.controller.js";

const router = Router();

router.get("/statistics", requireRole("ADMIN"), getDashboardStatisticsHandler);

export default router;