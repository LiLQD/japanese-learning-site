import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";
import { createHash, randomBytes } from "node:crypto";
import {
  registerSchema,
  loginSchema,
  verificationRequestSchema,
  verificationConfirmSchema,
} from "@app/shared";
import { sendVerificationEmail } from "../lib/email.js";

import { prisma } from "../lib/prisma.js";
import { conflict } from "../errors.js";
import { validateBody } from "../middleware/validate.js";

import { createNotification } from "../modules/notifications/notifications.service.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        avatarKey: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      res.status(401).json({
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
      });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/register",
  validateBody(registerSchema),
  async (req, res, next) => {
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

      // Đã xóa createNotification ở đây vì đăng ký xong chưa phải "quay trở lại"

      res.status(201).json({ message: "Đăng ký thành công", user });
    } catch (error) {
      next(error);
    }
  },
);

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
      const tokenHash = createHash("sha256").update(token).digest("hex");

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
      const tokenHash = createHash("sha256").update(token).digest("hex");

      const now = new Date();

      const verificationToken = await prisma.verificationToken.findFirst({
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

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Không tiết lộ email nào đã đăng ký.
    if (!user) {
      res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác.",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác.",
      });
      return;
    }

    if (user.status !== "ACTIVE") {
      res.status(403).json({
        message: "Tài khoản hiện không thể đăng nhập.",
      });
      return;
    }

    if (!user.emailVerifiedAt) {
      res.status(403).json({
        message: "Vui lòng xác minh email trước khi đăng nhập.",
        code: "EMAIL_NOT_VERIFIED",
      });
      return;
    }

    const sessionToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // THÊM THÔNG BÁO VÀO ĐÂY (Khi đăng nhập thành công)
    await createNotification(user.id, "LOGIN", {
      message: `Chào mừng ${user.displayName} quay trở lại YUME!`,
    });

    res.cookie("yume_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    res.status(200).json({
      message: "Đăng nhập thành công.",
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.yume_session;

    if (sessionToken) {
      const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

      await prisma.session.deleteMany({
        where: {
          tokenHash,
        },
      });
    }

    res.clearCookie("yume_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      message: "Đăng xuất thành công.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
