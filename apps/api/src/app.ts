import authRouter from "./routes/auth.js";

import usersRouter from "./modules/users/users.routes.js";
import profileRouter from "./modules/profile/profile.routes.js";
import notificationsRouter from "./modules/notifications/notifications.routes.js";
import kanjiRouter from "./modules/kanji/kanji.routes.js";
import readingRouter from "./modules/reading/reading.routes.js";
import wordsRouter from "./modules/words/words.routes.js";

import express from "express";
import helmet from "helmet";
import { loadSession } from "./middleware/load-session.js";
import path from "node:path";
import { healthResponseSchema } from "@app/shared";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(loadSession);
  app.use("/api/auth", authRouter);
  app.use("/api/admin/users", usersRouter);
  app.use("/api/kanji", kanjiRouter);
  app.use("/api/reading", readingRouter);
  app.use("/api/words", wordsRouter);
  app.use("/api/users/me", profileRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/api/admin/dashboard", dashboardRouter);
  app.get("/api/health", (_req, res) => {
    res.json(healthResponseSchema.parse({ status: "ok" }));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
