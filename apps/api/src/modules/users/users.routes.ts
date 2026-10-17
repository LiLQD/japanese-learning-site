import { Router } from "express";
import { requireRole } from "../../middleware/auth.js";
import { getUsers } from "./users.controller.js";

const router = Router();

router.use(requireRole("ADMIN"));

router.get("/", getUsers);

export default router;
