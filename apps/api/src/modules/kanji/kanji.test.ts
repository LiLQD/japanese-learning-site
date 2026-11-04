import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types.js";

const { findManyMock, countMock, createMock, transactionMock } = vi.hoisted(
  () => ({
    findManyMock: vi.fn(),
    countMock: vi.fn(),
    createMock: vi.fn(),
    transactionMock: vi.fn(),
  }),
);

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    kanji: {
      findMany: findManyMock,
      count: countMock,
      create: createMock,
    },
    $transaction: transactionMock,
  },
}));

import { Prisma } from "../../../generated/prisma/client.js";
import kanjiRouter from "./kanji.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use("/api/kanji", kanjiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const admin: AuthUser = { id: 1, role: "ADMIN" };

const sampleKanji = [
  {
    id: 1,
    character: "日",
    strokeCount: 4,
    radical: "日",
    jlpt: 5,
    createdAt: new Date("2026-10-10T00:00:00.000Z"),
  },
];

describe("GET /api/kanji", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue(sampleKanji);
    countMock.mockResolvedValue(21);
    transactionMock.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("is public for guests", async () => {
    const res = await request(makeApp()).get("/api/kanji");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(21);
  });

  it("is available to logged-in non-admin users", async () => {
    const res = await request(makeApp({ id: 2, role: "USER" })).get(
      "/api/kanji",
    );

    expect(res.status).toBe(200);
  });

  it("returns the first page with default page size", async () => {
    const res = await request(makeApp(admin)).get("/api/kanji");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      kanji: [
        {
          ...sampleKanji[0],
          createdAt: "2026-10-10T00:00:00.000Z",
        },
      ],
      total: 21,
      page: 1,
      pageSize: 20,
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it("orders kanji by id ascending", async () => {
    await request(makeApp()).get("/api/kanji");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { id: "asc" } }),
    );
  });

  it("returns an empty list when there is no kanji", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    const res = await request(makeApp(admin)).get("/api/kanji");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ kanji: [], total: 0, page: 1, pageSize: 20 });
  });

  it("applies page and pageSize from the query", async () => {
    const res = await request(makeApp(admin)).get(
      "/api/kanji?page=3&pageSize=5",
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 3, pageSize: 5 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });

  it.each(["page=0", "page=abc", "pageSize=101", "pageSize=0"])(
    "returns 400 for invalid query %s",
    async (query) => {
      const res = await request(makeApp(admin)).get(`/api/kanji?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(findManyMock).not.toHaveBeenCalled();
    },
  );

  it("returns 500 when the database is unreachable", async () => {
    findManyMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp(admin)).get("/api/kanji");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});

describe("POST /api/kanji", () => {
  const validInput = {
    character: "雨",
    jlpt: 5,
    strokeCount: 8,
    radical: "雨",
  };

  const createdKanji = {
    id: 28,
    ...validInput,
    createdAt: new Date("2026-11-03T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue(createdKanji);
  });

  it("returns 401 for guests", async () => {
    const res = await request(makeApp()).post("/api/kanji").send(validInput);

    expect(res.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin user", async () => {
    const res = await request(makeApp({ id: 2, role: "USER" }))
      .post("/api/kanji")
      .send(validInput);

    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a kanji and returns 201", async () => {
    const res = await request(makeApp(admin))
      .post("/api/kanji")
      .send(validInput);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      kanji: { ...createdKanji, createdAt: "2026-11-03T00:00:00.000Z" },
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: validInput }),
    );
  });

  it("stores empty optional fields as null", async () => {
    const res = await request(makeApp(admin))
      .post("/api/kanji")
      .send({ character: " 雨 ", jlpt: 5, strokeCount: null, radical: "雨" });

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { character: "雨", jlpt: 5, strokeCount: null, radical: "雨" },
      }),
    );
  });

  it.each([
    ["missing character", { jlpt: 5 }],
    ["empty character", { character: "  ", jlpt: 5 }],
    ["two characters", { character: "日本", jlpt: 5 }],
    ["latin letter", { character: "a", jlpt: 5 }],
    ["hiragana", { character: "あ", jlpt: 5 }],
    ["missing jlpt", { character: "雨" }],
    ["jlpt 0", { character: "雨", jlpt: 0 }],
    ["jlpt 6", { character: "雨", jlpt: 6 }],
    ["jlpt as text", { character: "雨", jlpt: "N5" }],
    ["stroke count 0", { character: "雨", jlpt: 5, strokeCount: 0 }],
    ["stroke count 85", { character: "雨", jlpt: 5, strokeCount: 85 }],
    ["decimal stroke count", { character: "雨", jlpt: 5, strokeCount: 2.5 }],
    ["two-letter radical", { character: "雨", jlpt: 5, radical: "ab" }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await request(makeApp(admin)).post("/api/kanji").send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the kanji already exists", async () => {
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const res = await request(makeApp(admin))
      .post("/api/kanji")
      .send(validInput);

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      code: "CONFLICT",
      message: "Chữ Kanji này đã tồn tại trong hệ thống!",
    });
  });

  it("returns 500 when the database is unreachable", async () => {
    createMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp(admin))
      .post("/api/kanji")
      .send(validInput);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
