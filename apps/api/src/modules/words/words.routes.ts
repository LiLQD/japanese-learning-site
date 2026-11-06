import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getWordByIdHandler, getWordList } from "./words.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", getWordList);
router.get("/:id", getWordByIdHandler);

export default router;
