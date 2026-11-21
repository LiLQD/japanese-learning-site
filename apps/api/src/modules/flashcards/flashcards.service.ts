import { forbidden, notFound } from "../../errors.js";
import type {
  FlashcardCardCreateInput,
  FlashcardCardUpdateInput,
  FlashcardDeckCreateInput,
  FlashcardDeckDetailResponse,
  FlashcardDeckListResponse,
} from "@app/shared";
import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const flashcardDeckListSelect = {
  id: true,
  name: true,
  description: true,
  visibility: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { cards: true } },
} satisfies Prisma.FlashcardDeckSelect;

const flashcardDeckDetailSelect = {
  ...flashcardDeckListSelect,
  cards: {
    select: {
      id: true,
      front: true,
      back: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.FlashcardDeckSelect;

type FlashcardDb = Pick<
  Prisma.TransactionClient,
  "flashcardDeck" | "flashcard"
>;

const CREATE_FLASHCARD_RETRY_LIMIT = 3;

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function mapDeck<T extends { createdAt: Date; updatedAt: Date }>(
  deck: T,
): Omit<T, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
} {
  return {
    ...deck,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
  };
}

function mapCard(card: {
  createdAt: Date;
  updatedAt: Date;
  id: number;
  front: string;
  back: string;
  position: number;
}) {
  return {
    ...card,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

export async function listFlashcardDecks(
  userId: number,
): Promise<FlashcardDeckListResponse> {
  const decks = await prisma.flashcardDeck.findMany({
    where: {
      OR: [{ visibility: "SHARED" }, { visibility: "PERSONAL", userId }],
    },
    select: flashcardDeckListSelect,
    orderBy: [{ visibility: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
  });

  return {
    decks: decks.map(({ _count, ...deck }) => ({
      cardCount: _count.cards,
      ...mapDeck(deck),
    })),
  };
}

export async function getFlashcardDeck(
  userId: number,
  deckId: number,
): Promise<FlashcardDeckDetailResponse> {
  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      OR: [{ visibility: "SHARED" }, { visibility: "PERSONAL", userId }],
    },
    select: flashcardDeckDetailSelect,
  });

  if (!deck) {
    throw notFound("Không tìm thấy bộ flashcard");
  }

  const { _count, ...deckWithoutCount } = deck;

  return {
    deck: {
      ...mapDeck(deckWithoutCount),
      cardCount: _count.cards,
      cards: deck.cards.map(mapCard),
    },
  };
}

export async function getFlashcardDeckForLearning(
  userId: number,
  deckId: number,
): Promise<FlashcardDeckDetailResponse> {
  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      OR: [{ visibility: "SHARED" }, { visibility: "PERSONAL", userId }],
    },
    select: flashcardDeckDetailSelect,
  });

  if (!deck) {
    throw notFound("Không tìm thấy bộ flashcard");
  }

  const { _count, ...deckWithoutCount } = deck;
  return {
    deck: {
      ...mapDeck(deckWithoutCount),
      cardCount: _count.cards,
      cards: deck.cards.map(mapCard),
    },
  };
}

async function getPersonalDeck(
  db: FlashcardDb,
  userId: number,
  deckId: number,
) {
  const deck = await db.flashcardDeck.findUnique({
    where: { id: deckId },
    select: { id: true, userId: true, visibility: true },
  });

  if (!deck) {
    throw notFound("Không tìm thấy bộ flashcard");
  }
  if (deck.visibility !== "PERSONAL" || deck.userId !== userId) {
    throw forbidden("Bạn không có quyền chỉnh sửa bộ flashcard này");
  }

  return deck;
}

export async function createFlashcardDeck(
  userId: number,
  input: FlashcardDeckCreateInput,
) {
  const deck = await prisma.flashcardDeck.create({
    data: {
      userId,
      visibility: "PERSONAL",
      name: input.name,
      description: input.description ?? null,
    },
    select: flashcardDeckListSelect,
  });

  const { _count, ...deckWithoutCount } = deck;
  return {
    ...mapDeck(deckWithoutCount),
    cardCount: _count.cards,
  };
}

export async function createFlashcard(
  userId: number,
  deckId: number,
  input: FlashcardCardCreateInput,
) {
  for (let attempt = 0; attempt < CREATE_FLASHCARD_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await getPersonalDeck(tx, userId, deckId);
          const lastCard = await tx.flashcard.findFirst({
            where: { deckId },
            orderBy: [{ position: "desc" }, { id: "desc" }],
            select: { position: true },
          });

          const card = await tx.flashcard.create({
            data: {
              deckId,
              front: input.front,
              back: input.back,
              position: (lastCard?.position ?? 0) + 1,
            },
            select: {
              id: true,
              front: true,
              back: true,
              position: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          return mapCard(card);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const retryable =
        isPrismaError(error, "P2002") || isPrismaError(error, "P2034");
      if (!retryable || attempt === CREATE_FLASHCARD_RETRY_LIMIT - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unable to create flashcard");
}

export async function updateFlashcard(
  userId: number,
  deckId: number,
  cardId: number,
  input: FlashcardCardUpdateInput,
) {
  return prisma.$transaction(async (tx) => {
    await getPersonalDeck(tx, userId, deckId);
    const existingCard = await tx.flashcard.findFirst({
      where: { id: cardId, deckId },
      select: { id: true },
    });
    if (!existingCard) {
      throw notFound("Không tìm thấy flashcard");
    }

    const card = await tx.flashcard.update({
      where: { id: cardId },
      data: {
        ...(input.front !== undefined && { front: input.front }),
        ...(input.back !== undefined && { back: input.back }),
      },
      select: {
        id: true,
        front: true,
        back: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return mapCard(card);
  });
}

export async function deleteFlashcard(
  userId: number,
  deckId: number,
  cardId: number,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await getPersonalDeck(tx, userId, deckId);
    const card = await tx.flashcard.findFirst({
      where: { id: cardId, deckId },
      select: { id: true, position: true },
    });
    if (!card) {
      throw notFound("Không tìm thấy flashcard");
    }

    const followingCards = await tx.flashcard.findMany({
      where: { deckId, position: { gt: card.position } },
      select: { id: true, position: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });

    await tx.flashcard.delete({ where: { id: cardId } });
    for (const followingCard of followingCards) {
      await tx.flashcard.update({
        where: { id: followingCard.id },
        data: { position: followingCard.position - 1 },
      });
    }
  });
}
