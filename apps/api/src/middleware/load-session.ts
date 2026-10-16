
import type { RequestHandler } from "express";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma.js";

export const loadSession: RequestHandler = async (req, _res, next) => {
  try {
    const sessionToken = req.cookies?.yume_session;

    if (!sessionToken || typeof sessionToken !== "string") {
      next();
      return;
    }

    const tokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        user: { status: "ACTIVE" },
      },
      select: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (session) {
      req.user = session.user;
    }

    next();
  } catch (error) {
    next(error);
  }
};
