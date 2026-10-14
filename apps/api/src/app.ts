import authRouter from "./routes/auth.js";
import express from "express";
import helmet from "helmet";
import { healthResponseSchema } from "@app/shared";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.get("/api/health", (_req, res) => {
    res.json(healthResponseSchema.parse({ status: "ok" }));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
