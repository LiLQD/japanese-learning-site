import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    word: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
      count: countMock,
    },
    $transaction: transactionMock,
  },
}));

import wordsRouter from "./words.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use("/api/words", wordsRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const user: AuthUser = { id: 2, role: "USER" };

const sampleWord = {
  id: 1,
  text: "日本語",
  jlpt: 5,
  readings: [
    { id: 1, kana: "にほんご", isPrimary: true },
    { id: 2, kana: "にっぽんご", isPrimary: false },
  ],
  senses: [
    {
      id: 1,
      position: 1,
      partOfSpeech: ["n"],
      glosses: [{ text: "tiếng Nhật" }],
    },
    {
      id: 2,
      position: 2,
      partOfSpeech: ["n", "unknown-code"],
      glosses: [{ text: "ngôn ngữ Nhật Bản" }],
    },
  ],
};

describe("GET /api/words", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue([sampleWord]);
    countMock.mockResolvedValue(1);
    transactionMock.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication", async () => {
    const res = await request(makeApp()).get("/api/words");

    expect(res.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns paginated vocabulary with Kana, Romaji, translated POS and Vietnamese meanings", async () => {
    const res = await request(makeApp(user)).get("/api/words");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      words: [
        {
          id: 1,
          text: "日本語",
          jlpt: 5,
          kana: "にほんご",
          romaji: "nihongo",
          senses: [
            {
              position: 1,
              partOfSpeech: ["Danh từ"],
              meanings: ["tiếng Nhật"],
            },
            {
              position: 2,
              partOfSpeech: ["Danh từ", "unknown-code"],
              meanings: ["ngôn ngữ Nhật Bản"],
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it("searches Japanese text, Kana and Vietnamese glosses only", async () => {
    await request(makeApp(user)).get("/api/words?q=ngôn%20ngữ");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { text: { contains: "ngôn ngữ", mode: "insensitive" } },
            {
              readings: {
                some: {
                  kana: { contains: "ngôn ngữ", mode: "insensitive" },
                },
              },
            },
            {
              senses: {
                some: {
                  glosses: {
                    some: {
                      lang: "vi",
                      text: { contains: "ngôn ngữ", mode: "insensitive" },
                    },
                  },
                },
              },
            },
          ],
        },
      }),
    );
  });

  it("applies pagination and stable word ordering", async () => {
    const res = await request(makeApp(user)).get(
      "/api/words?page=3&pageSize=5",
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 3, pageSize: 5 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
        orderBy: [{ text: "asc" }, { id: "asc" }],
      }),
    );
  });

  it("returns an empty result when no words match", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    const res = await request(makeApp(user)).get("/api/words?q=missing");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ words: [], total: 0, page: 1, pageSize: 20 });
  });

  it.each(["page=0", "page=abc", "pageSize=101", "pageSize=0"])(
    "returns 400 for invalid query %s",
    async (query) => {
      const res = await request(makeApp(user)).get(`/api/words?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(findManyMock).not.toHaveBeenCalled();
    },
  );

  it("returns 500 when the database is unreachable", async () => {
    findManyMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp(user)).get("/api/words");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});

describe("GET /api/words/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue(sampleWord);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication", async () => {
    const res = await request(makeApp()).get("/api/words/1");

    expect(res.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns the word detail and selects a primary reading", async () => {
    const res = await request(makeApp(user)).get("/api/words/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      word: {
        id: 1,
        text: "日本語",
        jlpt: 5,
        kana: "にほんご",
        romaji: "nihongo",
        senses: [
          {
            position: 1,
            partOfSpeech: ["Danh từ"],
            meanings: ["tiếng Nhật"],
          },
          {
            position: 2,
            partOfSpeech: ["Danh từ", "unknown-code"],
            meanings: ["ngôn ngữ Nhật Bản"],
          },
        ],
      },
    });
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it("returns the first stable reading when there is no primary reading", async () => {
    findUniqueMock.mockResolvedValue({
      ...sampleWord,
      readings: [
        { id: 1, kana: "にほんご", isPrimary: false },
        { id: 2, kana: "にっぽんご", isPrimary: false },
      ],
    });

    const res = await request(makeApp(user)).get("/api/words/1");

    expect(res.status).toBe(200);
    expect(res.body.word.kana).toBe("にほんご");
    expect(res.body.word.romaji).toBe("nihongo");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          readings: expect.objectContaining({
            orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
          }),
        }),
      }),
    );
  });

  it("preserves basic word data when readings, parts of speech or Vietnamese meanings are missing", async () => {
    findUniqueMock.mockResolvedValue({
      id: 3,
      text: "未登録",
      jlpt: null,
      readings: [],
      senses: [
        {
          id: 3,
          position: 1,
          partOfSpeech: [],
          glosses: [],
        },
      ],
    });

    const res = await request(makeApp(user)).get("/api/words/3");

    expect(res.status).toBe(200);
    expect(res.body.word).toEqual({
      id: 3,
      text: "未登録",
      jlpt: null,
      kana: null,
      romaji: null,
      senses: [{ position: 1, partOfSpeech: [], meanings: [] }],
    });
  });

  it("returns 404 when the word does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const res = await request(makeApp(user)).get("/api/words/9999");

    expect(res.status).toBe(404);
    expect(res.body.error).toEqual({
      code: "NOT_FOUND",
      message: "Không tìm thấy từ vựng phù hợp",
    });
  });

  it.each(["abc", "0", "-1", "1.5"])(
    "returns 400 for invalid id %s",
    async (id) => {
      const res = await request(makeApp(user)).get(`/api/words/${id}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
      expect(findUniqueMock).not.toHaveBeenCalled();
    },
  );

  it("returns 500 when the database is unreachable", async () => {
    findUniqueMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(makeApp(user)).get("/api/words/1");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
