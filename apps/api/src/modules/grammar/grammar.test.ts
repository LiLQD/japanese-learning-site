import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types.js";
import { Prisma } from "../../../generated/prisma/client.js";

const {
  findManyMock,
  findUniqueMock,
  countMock,
  createMock,
  updateMock,
  deleteMock,
  sessionFindFirstMock,
  transactionMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  countMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  sessionFindFirstMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    grammar: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
      count: countMock,
      create: createMock,
      update: updateMock,
      delete: deleteMock,
    },
    grammarExample: {
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    session: { findFirst: sessionFindFirstMock },
    $transaction: transactionMock,
  },
}));

import { loadSession } from "../../middleware/load-session.js";
import grammarRouter from "./grammar.routes.js";
import grammarAdminRouter from "./grammar-admin.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser, withSessionMiddleware = false) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  if (withSessionMiddleware) app.use(loadSession);
  else {
    app.use((req, _res, next) => {
      if (user) req.user = user;
      next();
    });
  }
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

describe("POST /api/grammar", () => {
  const input = {
    title: "Te form",
    pattern: "Vてください",
    meaning: "Xin hãy làm gì",
    jlpt: 5,
    examples: [
      {
        japanese: "座ってください",
        reading: null as string | null,
        vietnamese: "Xin hãy ngồi xuống",
      },
      {
        japanese: "見てください",
        reading: null as string | null,
        vietnamese: "Xin hãy xem",
      },
    ],
  };

  const createdGrammar = {
    id: 7,
    title: input.title,
    pattern: input.pattern,
    meaning: input.meaning,
    jlpt: input.jlpt,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue(createdGrammar);
  });

  it("creates grammar and multiple examples for an admin", async () => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(input);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ grammar: createdGrammar });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        title: input.title,
        pattern: input.pattern,
        meaning: input.meaning,
        jlpt: input.jlpt,
        examples: {
          create: [
            {
              japanese: "座ってください",
              reading: null as string | null,
              english: "Xin hãy ngồi xuống",
              position: 1,
            },
            {
              japanese: "見てください",
              reading: null as string | null,
              english: "Xin hãy xem",
              position: 2,
            },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        pattern: true,
        meaning: true,
        jlpt: true,
      },
    });
  });

  it("creates grammar with one example", async () => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send({ ...input, examples: [input.examples[0]] });

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          examples: {
            create: [
              {
                japanese: input.examples[0].japanese,
                reading: null as string | null,
                english: input.examples[0].vietnamese,
                position: 1,
              },
            ],
          },
        }),
      }),
    );
  });

  it.each([
    ["when examples is omitted", undefined],
    ["when examples is empty", []],
  ])("creates grammar without examples %s", async (_label, examples) => {
    const body = { ...input, examples };
    if (examples === undefined)
      delete (body as { examples?: unknown }).examples;

    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(body);

    expect(res.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        title: input.title,
        pattern: input.pattern,
        meaning: input.meaning,
        jlpt: input.jlpt,
      },
      select: {
        id: true,
        title: true,
        pattern: true,
        meaning: true,
        jlpt: true,
      },
    });
  });

  it("rejects guests", async () => {
    const res = await request(makeApp()).post("/api/grammar").send(input);
    expect(res.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects non-admin users", async () => {
    const res = await request(makeApp({ id: 2, role: "USER" }))
      .post("/api/grammar")
      .send(input);
    expect(res.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it.each([
    ["missing title", { ...input, title: undefined }],
    ["empty title", { ...input, title: " " }],
    ["missing pattern", { ...input, pattern: undefined }],
    ["empty pattern", { ...input, pattern: " " }],
    ["missing meaning", { ...input, meaning: undefined }],
    ["empty meaning", { ...input, meaning: " " }],
    ["missing JLPT", { ...input, jlpt: undefined }],
    ["string JLPT", { ...input, jlpt: "5" }],
    ["fractional JLPT", { ...input, jlpt: 2.5 }],
    ["JLPT below range", { ...input, jlpt: 0 }],
    ["JLPT above range", { ...input, jlpt: 6 }],
    [
      "missing Japanese example",
      { ...input, examples: [{ vietnamese: "Dịch" }] },
    ],
    [
      "empty Japanese example",
      {
        ...input,
        examples: [
          { japanese: " ", reading: null as string | null, vietnamese: "Dịch" },
        ],
      },
    ],
    [
      "missing Vietnamese translation",
      { ...input, examples: [{ japanese: "例" }] },
    ],
    [
      "empty Vietnamese translation",
      {
        ...input,
        examples: [
          { japanese: "例", reading: null as string | null, vietnamese: " " },
        ],
      },
    ],
  ])("rejects %s", async (_label, body) => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 503 when loadSession cannot connect to the database", async () => {
    sessionFindFirstMock.mockRejectedValue(
      Object.assign(new Error("session query failed"), {
        code: "ECONNREFUSED",
      }),
    );

    const res = await request(makeApp(undefined, true))
      .post("/api/grammar")
      .set("Cookie", "yume_session=valid-session")
      .send(input);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("DATABASE_UNAVAILABLE");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 503 for a recognized database connection error in the service", async () => {
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P1002",
        clientVersion: "test",
      }),
    );

    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(input);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("DATABASE_UNAVAILABLE");
  });

  it("returns 503 for Prisma P1017 when the server closes the connection", async () => {
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Server closed the connection", {
        code: "P1017",
        clientVersion: "test",
      }),
    );

    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(input);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("DATABASE_UNAVAILABLE");
  });

  it("does not classify P1000 as a connection error", async () => {
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Authentication failed", {
        code: "P1000",
        clientVersion: "test",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(input);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });

  it("returns the internal error for unrelated database errors", async () => {
    createMock.mockRejectedValue(new Error("query failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .post("/api/grammar")
      .send(input);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});

describe("GET and PATCH /api/admin/grammar/:id", () => {
  const current = {
    id: 12,
    title: "Thể て",
    pattern: "Vてください",
    meaning: "Xin hãy làm gì",
    jlpt: 5,
    examples: [
      {
        id: 21,
        japanese: "座ってください",
        reading: null as string | null,
        english: "Xin hãy ngồi xuống",
        position: 1,
      },
      {
        id: 22,
        japanese: "見てください",
        reading: null as string | null,
        english: "Xin hãy xem",
        position: 2,
      },
    ],
  };

  type ExampleFields = {
    japanese: string;
    reading: string | null;
    english: string;
    position: number;
  };

  type UpdateData = Partial<
    Pick<typeof current, "title" | "pattern" | "meaning" | "jlpt">
  > & {
    examples?: {
      deleteMany: { id?: { notIn: number[] } };
      update: Array<{ where: { id: number }; data: ExampleFields }>;
      create: ExampleFields[];
    };
  };

  function makeUpdatedGrammar(data: UpdateData) {
    let examples = [...current.examples];
    if (data.examples) {
      const retainedIds = data.examples.deleteMany.id?.notIn;
      examples = retainedIds
        ? examples.filter((example) => retainedIds.includes(example.id))
        : [];
      examples = examples.map((example) => {
        const update = data.examples?.update.find(
          ({ where }) => where.id === example.id,
        );
        return update ? { ...example, ...update.data } : example;
      });
      const nextId = Math.max(0, ...current.examples.map(({ id }) => id)) + 1;
      examples.push(
        ...data.examples.create.map((example, index) => ({
          id: nextId + index,
          ...example,
          reading: null as string | null,
        })),
      );
      examples.sort((left, right) => left.position - right.position);
    }

    return {
      ...current,
      ...data,
      ...(data.examples === undefined ? {} : { examples }),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue({
      id: current.id,
      examples: current.examples.map(({ id, japanese, reading }) => ({
        id,
        japanese,
        reading,
      })),
    });
    updateMock.mockImplementation(({ data }: { data: UpdateData }) =>
      Promise.resolve(makeUpdatedGrammar(data)),
    );
    transactionMock.mockImplementation(async (callback) =>
      callback({ grammar: { findUnique: findUniqueMock, update: updateMock } }),
    );
  });

  it("loads the existing grammar and examples for an admin", async () => {
    findUniqueMock.mockResolvedValue(current);
    const res = await request(makeApp({ id: 1, role: "ADMIN" })).get(
      "/api/admin/grammar/12",
    );

    expect(res.status).toBe(200);
    expect(res.body.grammar).toEqual({
      id: 12,
      title: "Thể て",
      pattern: "Vてください",
      meaning: "Xin hãy làm gì",
      jlpt: 5,
      examples: [
        {
          id: 21,
          japanese: "座ってください",
          reading: null as string | null,
          vietnamese: "Xin hãy ngồi xuống",
          position: 1,
        },
        {
          id: 22,
          japanese: "見てください",
          reading: null as string | null,
          vietnamese: "Xin hãy xem",
          position: 2,
        },
      ],
    });
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          examples: expect.objectContaining({
            select: expect.objectContaining({ reading: true }),
          }),
        }),
      }),
    );
  });

  it("rejects guests and regular users from the update routes", async () => {
    const guest = await request(makeApp())
      .patch("/api/admin/grammar/12")
      .send({ title: "更新" });
    const user = await request(makeApp({ id: 2, role: "USER" }))
      .patch("/api/admin/grammar/12")
      .send({ title: "更新" });

    expect(guest.status).toBe(401);
    expect(user.status).toBe(403);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("protects the admin detail endpoint from guests and regular users", async () => {
    const guest = await request(makeApp()).get("/api/admin/grammar/12");
    const user = await request(makeApp({ id: 2, role: "USER" })).get(
      "/api/admin/grammar/12",
    );

    expect(guest.status).toBe(401);
    expect(user.status).toBe(403);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("updates fields and synchronizes existing, new, and removed examples atomically", async () => {
    const updated = {
      title: "Tên mới",
      pattern: "Vてください",
      meaning: "Ý nghĩa mới",
      jlpt: 3,
      examples: [
        {
          id: 22,
          japanese: "見てください",
          reading: null as string | null,
          vietnamese: "Hãy xem nhé",
        },
        {
          japanese: "読んでください",
          reading: null as string | null,
          vietnamese: "Xin hãy đọc",
        },
      ],
    };
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send(updated);

    expect(res.status).toBe(200);
    expect(res.body.grammar.examples).toEqual([
      {
        id: 22,
        japanese: "見てください",
        reading: null as string | null,
        vietnamese: "Hãy xem nhé",
        position: 1,
      },
      {
        id: 23,
        japanese: "読んでください",
        reading: null as string | null,
        vietnamese: "Xin hãy đọc",
        position: 2,
      },
    ]);
    expect(res.body.grammar).toMatchObject({
      title: "Tên mới",
      pattern: "Vてください",
      meaning: "Ý nghĩa mới",
      jlpt: 3,
    });
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        title: "Tên mới",
        pattern: "Vてください",
        meaning: "Ý nghĩa mới",
        jlpt: 3,
        examples: {
          deleteMany: { id: { notIn: [22] } },
          update: [
            {
              where: { id: 22 },
              data: {
                japanese: "見てください",
                reading: null as string | null,
                english: "Hãy xem nhé",
                position: 1,
              },
            },
          ],
          create: [
            {
              japanese: "読んでください",
              reading: null as string | null,
              english: "Xin hãy đọc",
              position: 2,
            },
          ],
        },
      },
      select: expect.any(Object),
    });
  });

  it("sets JLPT to null when explicitly requested", async () => {
    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({ jlpt: null });

    expect(updateMock.mock.calls[0]?.[0].data).toEqual({ jlpt: null });
  });

  it("leaves JLPT out of the update when it was not submitted", async () => {
    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({ title: "Tên mới" });

    expect(updateMock.mock.calls[0]?.[0].data).toEqual({ title: "Tên mới" });
  });

  it("leaves examples unchanged when examples are omitted", async () => {
    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({ title: "Tên mới" });

    expect(updateMock.mock.calls[0]?.[0].data).toEqual({ title: "Tên mới" });
  });

  it("deletes all examples only when an empty array is submitted", async () => {
    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({ examples: [] });

    expect(updateMock.mock.calls[0]?.[0].data.examples).toEqual({
      deleteMany: {},
      update: [],
      create: [],
    });
  });

  it("rejects example IDs that belong to another grammar", async () => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({
        examples: [
          {
            id: 999,
            japanese: "例",
            reading: null as string | null,
            vietnamese: "Ví dụ",
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown grammar ID", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/999")
      .send({ title: "Tên mới" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it.each([
    ["empty body", {}],
    ["blank title", { title: "  " }],
    ["invalid JLPT", { jlpt: 6 }],
    ["non-integer JLPT", { jlpt: 2.5 }],
    [
      "blank example translation",
      {
        examples: [
          { japanese: "例", reading: null as string | null, vietnamese: " " },
        ],
      },
    ],
    [
      "duplicate example IDs",
      {
        examples: [
          {
            id: 21,
            japanese: "例1",
            reading: null as string | null,
            vietnamese: "Ví dụ 1",
          },
          {
            id: 21,
            japanese: "例2",
            reading: null as string | null,
            vietnamese: "Ví dụ 2",
          },
        ],
      },
    ],
  ])("rejects invalid update payload: %s", async (_name, body) => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("returns a server error when the transactional update fails", async () => {
    updateMock.mockRejectedValue(new Error("database write failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({ title: "Tên mới" });

    expect(res.status).toBe(500);
    expect(transactionMock).toHaveBeenCalledOnce();
  });

  it("uses the existing connection error response for admin database failures", async () => {
    updateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P1002",
        clientVersion: "test",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({ title: "Tên mới" });

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({
      code: "INTERNAL",
      message: "Lỗi kết nối!",
    });
  });

  it("clears the reading when japanese changes but reading is kept unchanged", async () => {
    findUniqueMock.mockResolvedValue({
      id: 12,
      examples: [
        { id: 21, japanese: "座ってください", reading: "すわってください" },
      ],
    });

    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({
        examples: [
          {
            id: 21,
            japanese: "立ってください",
            reading: "すわってください",
            vietnamese: "Xin hãy đứng",
          },
        ],
      });

    const updateData = updateMock.mock.calls[0]?.[0].data;
    expect(updateData.examples.update[0].data.reading).toBeNull();
  });

  it("keeps the new reading when japanese and reading both change", async () => {
    findUniqueMock.mockResolvedValue({
      id: 12,
      examples: [
        { id: 21, japanese: "座ってください", reading: "すわってください" },
      ],
    });

    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({
        examples: [
          {
            id: 21,
            japanese: "立ってください",
            reading: "たってください",
            vietnamese: "Xin hãy đứng",
          },
        ],
      });

    const updateData = updateMock.mock.calls[0]?.[0].data;
    expect(updateData.examples.update[0].data.reading).toBe("たってください");
  });

  it("stores an empty reading as null", async () => {
    findUniqueMock.mockResolvedValue({
      id: 12,
      examples: [{ id: 21, japanese: "座ってください", reading: "すわって" }],
    });

    await request(makeApp({ id: 1, role: "ADMIN" }))
      .patch("/api/admin/grammar/12")
      .send({
        examples: [
          {
            id: 21,
            japanese: "座ってください",
            reading: "",
            vietnamese: "Xin hãy ngồi",
          },
        ],
      });

    const updateData = updateMock.mock.calls[0]?.[0].data;
    expect(updateData.examples.update[0].data.reading).toBeNull();
  });
});

describe("DELETE /api/admin/grammar/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue({ id: 12 });
    deleteMock.mockResolvedValue({ id: 12 });
  });

  it("allows an admin to delete a grammar", async () => {
    const res = await request(makeApp({ id: 1, role: "ADMIN" })).delete(
      "/api/admin/grammar/12",
    );

    expect(res.status).toBe(204);
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 12 },
      select: { id: true },
    });
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 12 } });
  });

  it.each([
    ["guest", undefined, 401],
    ["regular user", { id: 2, role: "USER" } satisfies AuthUser, 403],
  ])("rejects %s from deleting a grammar", async (_actor, user, status) => {
    const res = await request(makeApp(user)).delete("/api/admin/grammar/12");
    expect(res.status).toBe(status);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it.each(["abc", "0", "-1", "1.5"])(
    "rejects an invalid grammar ID: %s",
    async (id) => {
      const res = await request(makeApp({ id: 1, role: "ADMIN" })).delete(
        `/api/admin/grammar/${id}`,
      );

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(findUniqueMock).not.toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
    },
  );

  it("returns not found when the grammar does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    const res = await request(makeApp({ id: 1, role: "ADMIN" })).delete(
      "/api/admin/grammar/999",
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("uses the existing database connection error response", async () => {
    deleteMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P1002",
        clientVersion: "test",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(makeApp({ id: 1, role: "ADMIN" })).delete(
      "/api/admin/grammar/12",
    );

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({
      code: "INTERNAL",
      message: "Lỗi kết nối!",
    });
  });
});

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
      message: "Lỗi kết nối!",
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
