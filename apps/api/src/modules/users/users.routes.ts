import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { getUser, getUsers } from "./users.controller.js";

const router = Router();

router.use(requireRole("ADMIN"));

router.get("/", getUsers);
router.get("/:id", getUser);

export default router;
