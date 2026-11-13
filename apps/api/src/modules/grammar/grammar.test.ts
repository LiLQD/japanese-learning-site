import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types.js";

const { findManyMock, countMock, transactionMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    grammar: {
      findMany: findManyMock,
      count: countMock,
    },
    $transaction: transactionMock,
  },
}));

import grammarRouter from "./grammar.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use("/api/grammar", grammarRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const sampleGrammars = [
  {
    id: 1,
    title: "Câu khẳng định cơ bản",
    pattern: "〜は〜です",
    meaning: "A là B",
    jlpt: 5,
  },
];

describe("GET /api/grammar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue(sampleGrammars);
    countMock.mockResolvedValue(21);
    transactionMock.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("is public for guests", async () => {
    const res = await request(makeApp()).get("/api/grammar");

    expect(res.status).toBe(200);
  });

  it("is available to logged-in users", async () => {
    const res = await request(makeApp({ id: 2, role: "USER" })).get(
      "/api/grammar",
    );

    expect(res.status).toBe(200);
  });

  it("returns the first page with default page size", async () => {
    const res = await request(makeApp()).get("/api/grammar");

    expect(res.body).toEqual({
      grammars: sampleGrammars,
      total: 21,
      page: 1,
      pageSize: 20,
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it("orders N5 first, then by id", async () => {
    await request(makeApp()).get("/api/grammar");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ jlpt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      }),
    );
  });

  it("applies page and pageSize from the query", async () => {
    const res = await request(makeApp()).get("/api/grammar?page=3&pageSize=5");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 3, pageSize: 5 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });

  it("returns an empty list when there is no grammar", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    const res = await request(makeApp()).get("/api/grammar");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      grammars: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it.each(["page=0", "page=abc", "pageSize=101", "pageSize=0"])(
    "returns 400 for invalid query %s",
    async (query) => {
      const res = await request(makeApp()).get(`/api/grammar?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(findManyMock).not.toHaveBeenCalled();
    },
  );

  it("returns 500 when the database is unreachable", async () => {
    findManyMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp()).get("/api/grammar");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
