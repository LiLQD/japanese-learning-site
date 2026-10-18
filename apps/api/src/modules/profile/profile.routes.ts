import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getMe,
  updateMe,
  updatePassword,
  uploadAvatar,
} from "./profile.controller.js";
import { upload } from "../../lib/multer.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMe);
router.patch("/", updateMe);
router.patch("/password", updatePassword);

router.post("/avatar", upload.single("avatar"), uploadAvatar);

export default router;
