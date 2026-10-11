import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { AuthUser } from "../types.js";
import { requireAuth, requireRole } from "./auth.js";
import { errorHandler, notFoundHandler } from "./error.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.get("/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });
  app.get("/admin", requireRole("ADMIN"), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("requireAuth", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(makeApp()).get("/me");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: "UNAUTHORIZED", message: expect.any(String) },
    });
  });

  it("passes through when authenticated", async () => {
    const res = await request(makeApp({ id: 1, role: "USER" })).get("/me");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 1, role: "USER" } });
  });
});

describe("requireRole", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(makeApp()).get("/admin");
    expect(res.status).toBe(401);
  });

  it("returns 403 when role does not match", async () => {
    const res = await request(makeApp({ id: 1, role: "USER" })).get("/admin");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    });
  });

  it("passes through when role matches", async () => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" })).get("/admin");
    expect(res.status).toBe(200);
  });
});

describe("404 handler", () => {
  it("returns a JSON error for unknown routes", async () => {
    const res = await request(makeApp()).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: expect.any(String) },
    });
  });
});
