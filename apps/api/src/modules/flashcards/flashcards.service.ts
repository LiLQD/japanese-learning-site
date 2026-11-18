import type { FlashcardDeckListResponse } from "@app/shared";
import type { Prisma } from "../../../generated/prisma/client.js";
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
      ...deck,
      cardCount: _count.cards,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
    })),
  };
}
