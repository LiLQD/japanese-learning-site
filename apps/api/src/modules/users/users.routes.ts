import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import {
  deleteUserHandler,
  getUser,
  getUsers,
  updateUserStatusHandler,
} from "./users.controller.js";

const router = Router();

router.use(requireRole("ADMIN"));

router.get("/", getUsers);
router.get("/:id", getUser);
router.patch("/:id/status", updateUserStatusHandler);
router.delete("/:id", deleteUserHandler);

export default router;
