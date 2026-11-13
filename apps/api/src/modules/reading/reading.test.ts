import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types.js";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    readingPassage: {
      findMany: findManyMock,
    },
  },
}));

import readingRouter from "./reading.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser) {
  const app = express();

  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });

  app.use("/api/reading", readingRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const user: AuthUser = { id: 2, role: "USER" };

const samplePassages = [
  { id: 1, title: "私の一日", jlpt: 5 },
  { id: 2, title: "日本の文化", jlpt: 4 },
];

describe("GET /api/reading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue(samplePassages);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is public for guests", async () => {
    const res = await request(makeApp()).get("/api/reading");

    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalled();
  });

  it("returns the reading passage list with basic information", async () => {
    const res = await request(makeApp(user)).get("/api/reading");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      passages: samplePassages,
    });
  });

  it("selects only required fields and applies stable ordering", async () => {
    await request(makeApp(user)).get("/api/reading");

    expect(findManyMock).toHaveBeenCalledWith({
      select: {
        id: true,
        title: true,
        jlpt: true,
      },
      orderBy: [{ jlpt: "asc" }, { title: "asc" }, { id: "asc" }],
    });
  });

  it("returns an empty list when no reading passages exist", async () => {
    findManyMock.mockResolvedValue([]);

    const res = await request(makeApp(user)).get("/api/reading");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ passages: [] });
  });

  it("returns 500 when the database is unreachable", async () => {
    findManyMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp(user)).get("/api/reading");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
