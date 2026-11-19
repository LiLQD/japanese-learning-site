import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  deckFindFirstMock,
  deckFindUniqueMock,
  deckCreateMock,
  cardFindFirstMock,
  cardFindManyMock,
  cardCreateMock,
  cardUpdateMock,
  cardDeleteMock,
  transactionMock,
} = vi.hoisted(() => ({
  deckFindFirstMock: vi.fn(),
  deckFindUniqueMock: vi.fn(),
  deckCreateMock: vi.fn(),
  cardFindFirstMock: vi.fn(),
  cardFindManyMock: vi.fn(),
  cardCreateMock: vi.fn(),
  cardUpdateMock: vi.fn(),
  cardDeleteMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    flashcardDeck: {
      findFirst: deckFindFirstMock,
      findUnique: deckFindUniqueMock,
      create: deckCreateMock,
    },
    flashcard: {
      findFirst: cardFindFirstMock,
      findMany: cardFindManyMock,
      create: cardCreateMock,
      update: cardUpdateMock,
      delete: cardDeleteMock,
    },
    $transaction: transactionMock,
  },
}));

import {
  createFlashcard,
  createFlashcardDeck,
  deleteFlashcard,
  updateFlashcard,
} from "./flashcards.service.js";

const personalDeck = {
  id: 7,
  userId: 42,
  visibility: "PERSONAL" as const,
};

const transactionClient = {
  flashcardDeck: { findUnique: deckFindUniqueMock },
  flashcard: {
    findFirst: cardFindFirstMock,
    findMany: cardFindManyMock,
    create: cardCreateMock,
    update: cardUpdateMock,
    delete: cardDeleteMock,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  transactionMock.mockImplementation(
    async (callback: (client: typeof transactionClient) => unknown) =>
      callback(transactionClient),
  );
  deckFindUniqueMock.mockResolvedValue(personalDeck);
});

describe("flashcard CRUD service", () => {
  it("creates a personal deck for the authenticated user", async () => {
    deckCreateMock.mockResolvedValue({
      id: 8,
      name: "My deck",
      description: "Practice",
      visibility: "PERSONAL",
      createdAt: new Date("2026-11-19T00:00:00.000Z"),
      updatedAt: new Date("2026-11-19T00:00:00.000Z"),
      _count: { cards: 0 },
    });

    await expect(
      createFlashcardDeck(42, { name: "My deck", description: "Practice" }),
    ).resolves.toMatchObject({
      id: 8,
      cardCount: 0,
      visibility: "PERSONAL",
    });
    expect(deckCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 42,
          visibility: "PERSONAL",
          name: "My deck",
          description: "Practice",
        },
      }),
    );
  });

  it("appends a card after the current last position", async () => {
    cardFindFirstMock.mockResolvedValue({ position: 3 });
    cardCreateMock.mockResolvedValue({
      id: 11,
      front: "猫",
      back: "Mèo",
      position: 4,
      createdAt: new Date("2026-11-19T00:00:00.000Z"),
      updatedAt: new Date("2026-11-19T00:00:00.000Z"),
    });

    await expect(
      createFlashcard(42, 7, { front: "猫", back: "Mèo" }),
    ).resolves.toMatchObject({ id: 11, position: 4 });
    expect(cardCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deckId: 7, front: "猫", back: "Mèo", position: 4 },
      }),
    );
  });

  it("rejects mutations against shared decks", async () => {
    deckFindUniqueMock.mockResolvedValue({
      id: 3,
      userId: null,
      visibility: "SHARED",
    });

    await expect(
      createFlashcard(42, 3, { front: "a", back: "b" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(cardCreateMock).not.toHaveBeenCalled();
  });

  it("updates a card owned by the authenticated user", async () => {
    cardFindFirstMock.mockResolvedValue({ id: 12 });
    cardUpdateMock.mockResolvedValue({
      id: 12,
      front: "新しい表",
      back: "New back",
      position: 1,
      createdAt: new Date("2026-11-19T00:00:00.000Z"),
      updatedAt: new Date("2026-11-19T00:00:00.000Z"),
    });

    await expect(
      updateFlashcard(42, 7, 12, { front: "新しい表", back: "New back" }),
    ).resolves.toMatchObject({ id: 12, front: "新しい表" });
  });

  it("deletes a card and closes the position gap", async () => {
    cardFindFirstMock.mockResolvedValue({ id: 12, position: 2 });
    cardFindManyMock.mockResolvedValue([
      { id: 13, position: 3 },
      { id: 14, position: 4 },
    ]);

    await expect(deleteFlashcard(42, 7, 12)).resolves.toBeUndefined();
    expect(cardFindManyMock).toHaveBeenCalledWith({
      where: { deckId: 7, position: { gt: 2 } },
      select: { id: true, position: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    expect(cardDeleteMock).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(cardUpdateMock).toHaveBeenNthCalledWith(1, {
      where: { id: 13 },
      data: { position: 2 },
    });
    expect(cardUpdateMock).toHaveBeenNthCalledWith(2, {
      where: { id: 14 },
      data: { position: 3 },
    });
  });
});
