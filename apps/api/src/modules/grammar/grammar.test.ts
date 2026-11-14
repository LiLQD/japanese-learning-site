import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types.js";

const { findManyMock, findUniqueMock, countMock, transactionMock } = vi.hoisted(
  () => ({
    findManyMock: vi.fn(),
    findUniqueMock: vi.fn(),
    countMock: vi.fn(),
    transactionMock: vi.fn(),
  }),
);

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    grammar: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
      count: countMock,
    },
    $transaction: transactionMock,
  },
}));

import grammarRouter from "./grammar.routes.js";
import grammarAdminRouter from "./grammar-admin.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use("/api/grammar", grammarRouter);
  app.use("/api/admin/grammar", grammarAdminRouter);
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

  it("does not filter when no keyword or jlpt is given", async () => {
    await request(makeApp()).get("/api/grammar");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(countMock).toHaveBeenCalledWith({ where: {} });
  });

  it("searches title, pattern and meaning case-insensitively", async () => {
    const res = await request(makeApp()).get(
      `/api/grammar?keyword=${encodeURIComponent("  Mong muốn ")}`,
    );

    const where = {
      OR: [
        { title: { contains: "Mong muốn", mode: "insensitive" } },
        { pattern: { contains: "Mong muốn", mode: "insensitive" } },
        { meaning: { contains: "Mong muốn", mode: "insensitive" } },
      ],
    };

    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(countMock).toHaveBeenCalledWith({ where });
  });

  it("searches Japanese patterns", async () => {
    await request(makeApp()).get(
      `/api/grammar?keyword=${encodeURIComponent("たい")}`,
    );

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { pattern: { contains: "たい", mode: "insensitive" } },
          ]),
        }),
      }),
    );
  });

  it("filters by JLPT level", async () => {
    await request(makeApp()).get("/api/grammar?jlpt=4");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jlpt: 4 } }),
    );
    expect(countMock).toHaveBeenCalledWith({ where: { jlpt: 4 } });
  });

  it("combines keyword and JLPT level", async () => {
    await request(makeApp()).get("/api/grammar?keyword=te&jlpt=4&page=2");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ jlpt: 4, OR: expect.any(Array) }),
        skip: 20,
      }),
    );
  });

  it("ignores a blank keyword", async () => {
    await request(makeApp()).get("/api/grammar?keyword=%20%20");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("returns 400 when the keyword is longer than 100 characters", async () => {
    const res = await request(makeApp()).get(
      `/api/grammar?keyword=${"a".repeat(101)}`,
    );

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Từ khóa tối đa 100 ký tự");
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it.each(["jlpt=0", "jlpt=6", "jlpt=N5", "jlpt=2.5"])(
    "returns 400 for invalid level %s",
    async (query) => {
      const res = await request(makeApp()).get(`/api/grammar?${query}`);

      expect(res.status).toBe(400);
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

describe("GET /api/admin/grammar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue(sampleGrammars);
    countMock.mockResolvedValue(1);
    transactionMock.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("allows admins and returns grammar fields including the stored JLPT value", async () => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" })).get(
      "/api/admin/grammar",
    );

    expect(res.status).toBe(200);
    expect(res.body.grammars).toEqual(sampleGrammars);
  });

  it.each([
    ["guest", undefined],
    ["regular user", { id: 2, role: "USER" } satisfies AuthUser],
  ])("rejects %s", async (_actor, user) => {
    const res = await request(makeApp(user)).get("/api/admin/grammar");

    expect(res.status).toBe(user ? 403 : 401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns an empty list when no grammar exists", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    const res = await request(makeApp({ id: 1, role: "ADMIN" })).get(
      "/api/admin/grammar",
    );

    expect(res.status).toBe(200);
    expect(res.body.grammars).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("uses the common internal error response for other server failures", async () => {
    findManyMock.mockRejectedValue(new Error("query failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp({ id: 1, role: "ADMIN" })).get(
      "/api/admin/grammar",
    );

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({
      code: "INTERNAL",
      message: "Internal server error",
    });
  });

  it("reports known database connection failures with the connection message", async () => {
    findManyMock.mockRejectedValue(
      Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp({ id: 1, role: "ADMIN" })).get(
      "/api/admin/grammar",
    );

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({
      code: "INTERNAL",
      message: "L\u1ed7i k\u1ebft n\u1ed1i!",
    });
  });
});

describe("GET /api/grammar/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue(sampleGrammars[0]);
  });

  it("is public and returns the grammar", async () => {
    const res = await request(makeApp()).get("/api/grammar/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ grammar: sampleGrammars[0] });
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it("returns 404 when the grammar does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const res = await request(makeApp()).get("/api/grammar/9999");

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      code: "NOT_FOUND",
      message: "Không tìm thấy ngữ pháp",
    });
  });

  it.each(["abc", "0", "-1", "1.5"])(
    "returns 400 for invalid id %s",
    async (id) => {
      const res = await request(makeApp()).get(`/api/grammar/${id}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(findUniqueMock).not.toHaveBeenCalled();
    },
  );

  it("returns 500 when the database is unreachable", async () => {
    findUniqueMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp()).get("/api/grammar/1");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
