import express from "express";
import helmet from "helmet";
import { healthResponseSchema } from "@app/shared";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.get("/api/health", (_req, res) => {
    res.json(healthResponseSchema.parse({ status: "ok" }));
  });
  return app;
}
