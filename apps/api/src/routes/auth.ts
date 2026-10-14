
import { Router } from "express";
import bcrypt from "bcryptjs";
import { registerSchema } from "@app/shared";
import { prisma } from "../lib/prisma.js";
import { conflict } from "../errors.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { displayName, email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw conflict("Email đã được sử dụng");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        displayName,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: "Đăng ký thành công", user });
  } catch (error) {
    next(error);
  }
});

export default router;
