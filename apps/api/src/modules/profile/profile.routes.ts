import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getMe, updateMe, updatePassword } from "./profile.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMe);
router.patch("/", updateMe);
router.patch("/password", updatePassword);

export default router;
