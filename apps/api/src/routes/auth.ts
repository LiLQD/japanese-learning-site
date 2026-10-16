
import { Router } from "express";
import bcrypt from "bcryptjs";

import { createHash, randomBytes } from "node:crypto";
import {
  registerSchema,
  verificationRequestSchema,
  verificationConfirmSchema,
} from "@app/shared";
import { sendVerificationEmail } from "../lib/email.js";

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

router.post(
  "/verification/request",
  validateBody(verificationRequestSchema),
  async (req, res, next) => {
    try {
      const { email } = verificationRequestSchema.parse(req.body);
      const normalizedEmail = email.toLowerCase();

      const genericResponse = {
        message:
          "Nếu tài khoản tồn tại và chưa xác minh, email hướng dẫn sẽ được gửi.",
      };

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          emailVerifiedAt: true,
        },
      });

      // Không tiết lộ email có tài khoản hay đã xác minh hay chưa.
      if (!user || user.emailVerifiedAt) {
        res.status(202).json(genericResponse);
        return;
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

      await prisma.verificationToken.create({
        data: {
          tokenHash,
          type: "EMAIL_VERIFY",
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      await sendVerificationEmail(normalizedEmail, token);

      res.status(202).json(genericResponse);
    } catch (error) {
      next(error);
    }
  },
);


router.post(
  "/verification/confirm",
  validateBody(verificationConfirmSchema),
  async (req, res, next) => {
    try {
      const { token } = verificationConfirmSchema.parse(req.body);

      // Chỉ lưu và tìm kiếm hash, không lưu token thô.
      const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

      const now = new Date();

      const verificationToken =
        await prisma.verificationToken.findFirst({
          where: {
            tokenHash,
            type: "EMAIL_VERIFY",
            usedAt: null,
            expiresAt: { gt: now },
          },
          select: {
            id: true,
            userId: true,
          },
        });

      if (!verificationToken) {
        res.status(400).json({
          message: "Token không hợp lệ hoặc đã hết hạn.",
        });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Chỉ một yêu cầu có thể sử dụng token này thành công.
        const result = await tx.verificationToken.updateMany({
          where: {
            id: verificationToken.id,
            usedAt: null,
            expiresAt: { gt: now },
          },
          data: {
            usedAt: now,
          },
        });

        if (result.count !== 1) {
          throw new Error("VERIFICATION_TOKEN_ALREADY_USED");
        }

        await tx.user.update({
          where: {
            id: verificationToken.userId,
          },
          data: {
            emailVerifiedAt: now,
          },
        });
      });

      res.status(200).json({
        message: "Xác minh email thành công.",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "VERIFICATION_TOKEN_ALREADY_USED"
      ) {
        res.status(400).json({
          message: "Token không hợp lệ hoặc đã hết hạn.",
        });
        return;
      }

      next(error);
    }
  },
);

export default router;
