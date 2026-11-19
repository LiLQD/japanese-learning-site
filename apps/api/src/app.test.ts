import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  sessionFindFirstMock,
  flashcardDeckFindManyMock,
  flashcardDeckFindFirstMock,
} = vi.hoisted(() => ({
  sessionFindFirstMock: vi.fn(),
  flashcardDeckFindManyMock: vi.fn(),
  flashcardDeckFindFirstMock: vi.fn(),
}));

vi.mock("./lib/prisma.js", () => ({
  prisma: {
    session: { findFirst: sessionFindFirstMock },
    flashcardDeck: {
      findMany: flashcardDeckFindManyMock,
      findFirst: flashcardDeckFindFirstMock,
    },
  },
}));

import { createApp } from "./app.js";

beforeEach(() => {
  vi.clearAllMocks();
  sessionFindFirstMock.mockResolvedValue({
    user: { id: 42, role: "USER" },
  });
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/flashcards/decks", () => {
  it("rejects guests", async () => {
    const res = await request(createApp()).get("/api/flashcards/decks");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(flashcardDeckFindManyMock).not.toHaveBeenCalled();
  });

  it("returns shared decks and only the authenticated user's personal decks", async () => {
    const sharedDecks = [
      {
        id: 1,
        name: "Từ vựng tiếng Nhật N5",
        description: "Từ vựng N5",
        visibility: "SHARED",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-02T00:00:00.000Z"),
        _count: { cards: 30 },
      },
      {
        id: 2,
        name: "Từ vựng tiếng Nhật N4",
        description: "Từ vựng N4",
        visibility: "SHARED",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-02T00:00:00.000Z"),
        _count: { cards: 30 },
      },
      {
        id: 3,
        name: "Ngữ pháp tiếng Nhật N5",
        description: "Ngữ pháp N5",
        visibility: "SHARED",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-02T00:00:00.000Z"),
        _count: { cards: 20 },
      },
    ];

    for (const [userId, ownDeckId] of [
      [42, 4],
      [99, 5],
    ]) {
      sessionFindFirstMock.mockResolvedValueOnce({
        user: { id: userId, role: "USER" },
      });
      flashcardDeckFindManyMock.mockResolvedValueOnce([
        ...sharedDecks,
        {
          id: ownDeckId,
          name: `Deck của user ${userId}`,
          description: null,
          visibility: "PERSONAL",
          createdAt: new Date("2026-10-03T00:00:00.000Z"),
          updatedAt: new Date("2026-10-04T00:00:00.000Z"),
          _count: { cards: 2 },
        },
      ]);

      const res = await request(createApp())
        .get("/api/flashcards/decks?userId=777")
        .set("Cookie", "yume_session=valid-token")
        .send({ userId: 777 });

      expect(res.status).toBe(200);
      expect(res.body.decks).toHaveLength(4);
      expect(res.body.decks.map((deck: { id: number }) => deck.id)).toEqual([
        1,
        2,
        3,
        ownDeckId,
      ]);
      expect(
        res.body.decks.map((deck: { visibility: string }) => deck.visibility),
      ).toEqual(["SHARED", "SHARED", "SHARED", "PERSONAL"]);
      expect(flashcardDeckFindManyMock).toHaveBeenNthCalledWith(
        userId === 42 ? 1 : 2,
        {
          where: {
            OR: [{ visibility: "SHARED" }, { visibility: "PERSONAL", userId }],
          },
          select: {
            id: true,
            name: true,
            description: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { cards: true } },
          },
          orderBy: [
            { visibility: "desc" },
            { updatedAt: "desc" },
            { id: "desc" },
          ],
        },
      );
    }
  });

  it("returns an empty list when the user has no decks", async () => {
    flashcardDeckFindManyMock.mockResolvedValue([]);

    const res = await request(createApp())
      .get("/api/flashcards/decks")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ decks: [] });
    expect(flashcardDeckFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { visibility: "SHARED" },
            { visibility: "PERSONAL", userId: 42 },
          ],
        },
      }),
    );
  });

  it("reports database failures with the standard internal error response", async () => {
    flashcardDeckFindManyMock.mockRejectedValue(new Error("database down"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const res = await request(createApp())
      .get("/api/flashcards/decks")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});

describe("GET /api/flashcards/decks/:deckId/learning", () => {
  beforeEach(() => {
    flashcardDeckFindFirstMock.mockResolvedValue({
      id: 9,
      name: "Deck cá nhân",
      description: null,
      visibility: "PERSONAL",
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-02T00:00:00.000Z"),
      _count: { cards: 2 },
      cards: [
        {
          id: 21,
          front: "猫",
          back: "Mèo",
          position: 1,
          createdAt: new Date("2026-10-01T00:00:00.000Z"),
          updatedAt: new Date("2026-10-02T00:00:00.000Z"),
        },
        {
          id: 22,
          front: "犬",
          back: "Chó",
          position: 2,
          createdAt: new Date("2026-10-01T00:00:00.000Z"),
          updatedAt: new Date("2026-10-02T00:00:00.000Z"),
        },
      ],
    });
  });

  it("returns ordered cards from the authenticated user's personal deck", async () => {
    const res = await request(createApp())
      .get("/api/flashcards/decks/9/learning")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(200);
    expect(
      res.body.deck.cards.map((card: { position: number }) => card.position),
    ).toEqual([1, 2]);
    expect(flashcardDeckFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 9,
          OR: [
            { visibility: "SHARED" },
            { visibility: "PERSONAL", userId: 42 },
          ],
        },
        select: expect.objectContaining({
          cards: expect.objectContaining({
            orderBy: [{ position: "asc" }, { id: "asc" }],
          }),
        }),
      }),
    );
  });

  it("allows an authenticated user to study a shared deck", async () => {
    flashcardDeckFindFirstMock.mockResolvedValue({
      id: 10,
      name: "Deck dùng chung",
      description: null,
      visibility: "SHARED",
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-02T00:00:00.000Z"),
      _count: { cards: 1 },
      cards: [
        {
          id: 30,
          front: "猫",
          back: "Mèo",
          position: 1,
          createdAt: new Date("2026-10-01T00:00:00.000Z"),
          updatedAt: new Date("2026-10-02T00:00:00.000Z"),
        },
      ],
    });

    const res = await request(createApp())
      .get("/api/flashcards/decks/10/learning")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(200);
    expect(res.body.deck.visibility).toBe("SHARED");
    expect(res.body.deck.cards[0]).toMatchObject({
      front: "猫",
      back: "Mèo",
      position: 1,
    });
    expect(flashcardDeckFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 10,
          OR: [
            { visibility: "SHARED" },
            { visibility: "PERSONAL", userId: 42 },
          ],
        },
        select: expect.objectContaining({
          cards: expect.objectContaining({
            orderBy: [{ position: "asc" }, { id: "asc" }],
          }),
        }),
      }),
    );
  });

  it("allows an authenticated user to start learning an empty shared deck", async () => {
    flashcardDeckFindFirstMock.mockResolvedValue({
      id: 11,
      name: "Deck mẫu rỗng",
      description: null,
      visibility: "SHARED",
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-02T00:00:00.000Z"),
      _count: { cards: 0 },
      cards: [],
    });

    const res = await request(createApp())
      .get("/api/flashcards/decks/11/learning")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(200);
    expect(res.body.deck.visibility).toBe("SHARED");
    expect(res.body.deck.cards).toEqual([]);
  });

  it("does not allow guests to start a learning session", async () => {
    sessionFindFirstMock.mockResolvedValue(null);

    const res = await request(createApp()).get(
      "/api/flashcards/decks/9/learning",
    );

    expect(res.status).toBe(401);
    expect(flashcardDeckFindFirstMock).not.toHaveBeenCalled();
  });

  it("does not allow administrators to use the learner endpoint", async () => {
    sessionFindFirstMock.mockResolvedValue({
      user: { id: 42, role: "ADMIN" },
    });

    const res = await request(createApp())
      .get("/api/flashcards/decks/9/learning")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(403);
    expect(flashcardDeckFindFirstMock).not.toHaveBeenCalled();
  });

  it("does not expose another user's personal deck for learning", async () => {
    flashcardDeckFindFirstMock.mockResolvedValue(null);

    const res = await request(createApp())
      .get("/api/flashcards/decks/99/learning")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(404);
    expect(flashcardDeckFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 99,
          OR: [
            { visibility: "SHARED" },
            { visibility: "PERSONAL", userId: 42 },
          ],
        },
      }),
    );
  });

  it("rejects an invalid deck ID", async () => {
    const res = await request(createApp())
      .get("/api/flashcards/decks/abc/learning")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(400);
    expect(flashcardDeckFindFirstMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/flashcards/decks/:deckId", () => {
  it("continues to allow authenticated users to view shared deck details", async () => {
    flashcardDeckFindFirstMock.mockResolvedValue({
      id: 1,
      name: "Bộ mẫu",
      description: null,
      visibility: "SHARED",
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-02T00:00:00.000Z"),
      _count: { cards: 1 },
      cards: [],
    });

    const res = await request(createApp())
      .get("/api/flashcards/decks/1")
      .set("Cookie", "yume_session=valid-token");

    expect(res.status).toBe(200);
    expect(res.body.deck.visibility).toBe("SHARED");
    expect(flashcardDeckFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 1,
          OR: [
            { visibility: "SHARED" },
            { visibility: "PERSONAL", userId: 42 },
          ],
        },
      }),
    );
  });
});
