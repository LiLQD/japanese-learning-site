import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getNotifications,
  readNotification,
} from "./notifications.controller.js";

const router = Router();

router.use(requireAuth); // Bắt buộc đăng nhập
router.get("/", getNotifications);
router.patch("/:id/read", readNotification);

export default router;
