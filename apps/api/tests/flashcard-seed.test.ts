import { describe, expect, it } from "vitest";
import {
  buildFlashcardDeckSeeds,
  seedFlashcardDecks,
  type FlashcardSeedDatabaseClient,
  type FlashcardSeedClient,
} from "../prisma/flashcard-seed.js";

function vocabulary(level: number, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: level * 100 + index,
    text: `${level}-${index}`,
    jlpt: level,
    readings: [{ kana: `kana-${level}-${index}`, isPrimary: true }],
    senses: [
      {
        glosses: [{ lang: "vi", text: `meaning-${level}-${index}` }],
      },
    ],
  }));
}

function grammar(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    pattern: `pattern-${index}`,
    meaning: `meaning-${index}`,
    usage: `usage-${index}`,
    jlpt: 5,
    examples: [
      {
        japanese: `sentence-${index}`,
        vietnamese: `translation-${index}`,
      },
    ],
  }));
}

type MemoryClient = FlashcardSeedDatabaseClient & {
  decks: Map<
    string,
    {
      id: number;
      seedKey: string;
      userId: number | null;
      visibility: "PERSONAL" | "SHARED";
      name: string;
      description: string;
    }
  >;
  cards: Map<
    string,
    {
      id: number;
      seedKey: string;
      deckId: number;
      front: string;
      back: string;
      position: number;
    }
  >;
  transactionCount: number;
  setFailure: (failure: {
    deckUpdateAt?: number;
    cardUpdateAt?: number;
    cardCreateAt?: number;
  }) => void;
};

function createMemoryClient(): MemoryClient & FlashcardSeedClient {
  const decks = new Map<
    string,
    {
      id: number;
      seedKey: string;
      userId: number | null;
      visibility: "PERSONAL" | "SHARED";
      name: string;
      description: string;
    }
  >();
  const cards = new Map<
    string,
    {
      id: number;
      seedKey: string;
      deckId: number;
      front: string;
      back: string;
      position: number;
    }
  >();
  let transactionCount = 0;
  let deckUpdateCount = 0;
  let cardUpdateCount = 0;
  let cardCreateCount = 0;
  let failure: {
    deckUpdateAt?: number;
    cardUpdateAt?: number;
    cardCreateAt?: number;
  } = {};

  const client = {
    decks,
    cards,
    get transactionCount() {
      return transactionCount;
    },
    setFailure: (nextFailure: typeof failure) => {
      failure = nextFailure;
      deckUpdateCount = 0;
      cardUpdateCount = 0;
      cardCreateCount = 0;
    },
    flashcardDeck: {
      findUnique: async ({ where }) => {
        const deck = decks.get(where.seedKey);
        return deck
          ? {
              id: deck.id,
              visibility: deck.visibility,
              userId: deck.userId,
            }
          : null;
      },
      create: async ({ data }) => {
        if (decks.has(data.seedKey)) {
          throw new Error(`Unique seedKey conflict: ${data.seedKey}`);
        }
        const deck = { id: decks.size + 1, ...data };
        decks.set(data.seedKey, deck);
        return { id: deck.id };
      },
      updateMany: async ({ where, data }) => {
        deckUpdateCount++;
        if (failure.deckUpdateAt === deckUpdateCount) {
          return { count: 0 };
        }
        const entry = [...decks.entries()].find(
          ([, deck]) =>
            deck.id === where.id &&
            deck.seedKey === where.seedKey &&
            deck.visibility === where.visibility &&
            deck.userId === where.userId,
        );
        if (!entry) {
          return { count: 0 };
        }
        Object.assign(entry[1], data);
        return { count: 1 };
      },
    },
    flashcard: {
      findUnique: async ({ where }) => {
        const card = cards.get(where.seedKey);
        return card ? { id: card.id, deckId: card.deckId } : null;
      },
      create: async ({ data }) => {
        cardCreateCount++;
        if (failure.cardCreateAt === cardCreateCount) {
          throw new Error(`Unique seedKey conflict: ${data.seedKey}`);
        }
        if (cards.has(data.seedKey)) {
          throw new Error(`Unique seedKey conflict: ${data.seedKey}`);
        }
        const card = { id: cards.size + 1, ...data };
        cards.set(data.seedKey, card);
        return card;
      },
      updateMany: async ({ where, data }) => {
        cardUpdateCount++;
        if (failure.cardUpdateAt === cardUpdateCount) {
          return { count: 0 };
        }
        const entry = [...cards.entries()].find(
          ([, card]) =>
            card.id === where.id &&
            card.seedKey === where.seedKey &&
            card.deckId === where.deckId,
        );
        if (!entry) {
          return { count: 0 };
        }
        Object.assign(entry[1], data);
        return { count: 1 };
      },
    },
  };

  return Object.assign(client, {
    $transaction: async (
      callback: (transaction: FlashcardSeedClient) => Promise<void>,
    ) => {
      transactionCount++;
      const deckSnapshot = structuredClone([...decks.entries()]);
      const cardSnapshot = structuredClone([...cards.entries()]);
      try {
        await callback(client as unknown as FlashcardSeedClient);
      } catch (error) {
        decks.clear();
        for (const [key, value] of deckSnapshot) decks.set(key, value);
        cards.clear();
        for (const [key, value] of cardSnapshot) cards.set(key, value);
        throw error;
      }
    },
  }) as unknown as MemoryClient & FlashcardSeedClient;
}

describe("Flashcard seed", () => {
  it("builds exactly three shared decks with 30, 30, and 20 ordered cards", () => {
    const decks = buildFlashcardDeckSeeds({
      vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
      grammars: grammar(20),
    });

    expect(decks.map(({ name, cards }) => [name, cards.length])).toEqual([
      ["Từ vựng tiếng Nhật N5", 30],
      ["Từ vựng tiếng Nhật N4", 30],
      ["Ngữ pháp tiếng Nhật N5", 20],
    ]);
    expect(decks.flatMap(({ cards }) => cards)).toHaveLength(80);
    expect(decks[0].cards[0]).toMatchObject({
      front: "5-0",
      back: "kana-5-0 — meaning-5-0",
      position: 1,
    });
    expect(decks[2].cards[0].back).toContain("sentence-0");
    expect(decks[2].cards[0].back).toContain("translation-0");
  });

  it("refuses insufficient source data before creating any shared deck", async () => {
    const client = createMemoryClient();

    await expect(
      seedFlashcardDecks(client, {
        vocabulary: [...vocabulary(5, 29), ...vocabulary(4, 30)],
        grammars: grammar(20),
      }),
    ).rejects.toThrow("at least 30 N5 vocabulary entries");
    expect(client.decks.size).toBe(0);
    expect(client.cards.size).toBe(0);
  });

  it("rejects a sample deck seed key owned by a personal deck without changing it", async () => {
    const client = createMemoryClient();
    const personalDeck = {
      id: 100,
      seedKey: "vocabulary-n5",
      userId: 8,
      visibility: "PERSONAL" as const,
      name: "My deck",
      description: "Personal content",
    };
    client.decks.set(personalDeck.seedKey, personalDeck);

    await expect(
      seedFlashcardDecks(client, {
        vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
        grammars: grammar(20),
      }),
    ).rejects.toThrow(/vocabulary-n5/);

    expect(client.decks.get(personalDeck.seedKey)).toEqual(personalDeck);
  });

  it("rejects a sample card seed key owned by a personal deck without changing it", async () => {
    const client = createMemoryClient();
    const personalDeck = {
      id: 100,
      seedKey: "personal-deck",
      userId: 8,
      visibility: "PERSONAL" as const,
      name: "My deck",
      description: "Personal content",
    };
    const personalCard = {
      id: 100,
      seedKey: "flashcard:vocabulary-n5:1",
      deckId: personalDeck.id,
      front: "私のカード",
      back: "personal content",
      position: 1,
    };
    client.decks.set(personalDeck.seedKey, personalDeck);
    client.cards.set(personalCard.seedKey, personalCard);

    await expect(
      seedFlashcardDecks(client, {
        vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
        grammars: grammar(20),
      }),
    ).rejects.toThrow(/flashcard:vocabulary-n5:1/);

    expect(client.decks.get(personalDeck.seedKey)).toEqual(personalDeck);
    expect(client.cards.get(personalCard.seedKey)).toEqual(personalCard);
    expect(client.decks.size).toBe(1);
    expect(client.cards.size).toBe(1);
  });

  it("rejects a sample card seed key assigned to a different shared deck", async () => {
    const client = createMemoryClient();
    const targetSharedDeck = {
      id: 50,
      seedKey: "vocabulary-n5",
      userId: null,
      visibility: "SHARED" as const,
      name: "Từ vựng tiếng Nhật N5",
      description: "Target sample deck",
    };
    const otherSharedDeck = {
      id: 88,
      seedKey: "vocabulary-n4",
      userId: null,
      visibility: "SHARED" as const,
      name: "Từ vựng tiếng Nhật N4",
      description: "Other sample deck",
    };
    const cardInOtherDeck = {
      id: 100,
      seedKey: "flashcard:vocabulary-n5:1",
      deckId: otherSharedDeck.id,
      front: "別のデッキ",
      back: "content for another deck",
      position: 1,
    };
    client.decks.set(targetSharedDeck.seedKey, targetSharedDeck);
    client.decks.set(otherSharedDeck.seedKey, otherSharedDeck);
    client.cards.set(cardInOtherDeck.seedKey, cardInOtherDeck);

    await expect(
      seedFlashcardDecks(client, {
        vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
        grammars: grammar(20),
      }),
    ).rejects.toThrow(/flashcard:vocabulary-n5:1/);

    expect(client.decks.get(targetSharedDeck.seedKey)).toEqual(
      targetSharedDeck,
    );
    expect(client.decks.get(otherSharedDeck.seedKey)).toEqual(otherSharedDeck);
    expect(client.cards.get(cardInOtherDeck.seedKey)).toEqual(cardInOtherDeck);
    expect(client.decks.size).toBe(2);
    expect(client.cards.size).toBe(1);
  });

  it("upserts the same 3 decks and 80 cards on repeated runs", async () => {
    const client = createMemoryClient();
    const source = {
      vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
      grammars: grammar(20),
    };

    await seedFlashcardDecks(client, source);
    await seedFlashcardDecks(client, source);

    expect(client.decks.size).toBe(3);
    expect(client.cards.size).toBe(80);
    expect(client.transactionCount).toBe(2);
    expect(
      [...client.decks.values()].every(
        (deck) => deck.visibility === "SHARED" && deck.userId === null,
      ),
    ).toBe(true);
  });

  it("rolls back all writes when a deck update affects no row", async () => {
    const client = createMemoryClient();
    const source = {
      vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
      grammars: grammar(20),
    };
    await seedFlashcardDecks(client, source);
    const beforeDecks = structuredClone([...client.decks.entries()]);
    const beforeCards = structuredClone([...client.cards.entries()]);
    source.vocabulary[0].senses[0].glosses[0].text = "changed";
    client.setFailure({ deckUpdateAt: 2 });

    await expect(seedFlashcardDecks(client, source)).rejects.toThrow(
      /changed ownership or visibility/,
    );

    expect([...client.decks.entries()]).toEqual(beforeDecks);
    expect([...client.cards.entries()]).toEqual(beforeCards);
  });

  it("rolls back all writes when a card update affects no row", async () => {
    const client = createMemoryClient();
    const source = {
      vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
      grammars: grammar(20),
    };
    await seedFlashcardDecks(client, source);
    const beforeDecks = structuredClone([...client.decks.entries()]);
    const beforeCards = structuredClone([...client.cards.entries()]);
    source.vocabulary[0].senses[0].glosses[0].text = "changed";
    client.setFailure({ cardUpdateAt: 2 });

    await expect(seedFlashcardDecks(client, source)).rejects.toThrow(
      /changed decks while seeding/,
    );

    expect([...client.decks.entries()]).toEqual(beforeDecks);
    expect([...client.cards.entries()]).toEqual(beforeCards);
  });

  it("rolls back prior deck and card creates after a unique card conflict", async () => {
    const client = createMemoryClient();
    client.setFailure({ cardCreateAt: 35 });

    await expect(
      seedFlashcardDecks(client, {
        vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
        grammars: grammar(20),
      }),
    ).rejects.toThrow(/Unique seedKey conflict/);

    expect(client.decks.size).toBe(0);
    expect(client.cards.size).toBe(0);
    expect(client.transactionCount).toBe(1);
  });

  it("rolls back earlier updates and preserves personal records after a late failure", async () => {
    const client = createMemoryClient();
    const personalDeck = {
      id: 100,
      seedKey: "personal-deck",
      userId: 8,
      visibility: "PERSONAL" as const,
      name: "My deck",
      description: "Private description",
    };
    const personalCard = {
      id: 100,
      seedKey: "personal-card",
      deckId: 100,
      front: "mine",
      back: "my answer",
      position: 1,
    };
    client.decks.set(personalDeck.seedKey, personalDeck);
    client.cards.set(personalCard.seedKey, personalCard);
    const source = {
      vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
      grammars: grammar(20),
    };
    await seedFlashcardDecks(client, source);
    const beforeDecks = structuredClone([...client.decks.entries()]);
    const beforeCards = structuredClone([...client.cards.entries()]);
    source.vocabulary[0].senses[0].glosses[0].text = "changed";
    client.setFailure({ cardUpdateAt: 35 });

    await expect(seedFlashcardDecks(client, source)).rejects.toThrow(
      /changed decks while seeding/,
    );

    expect([...client.decks.entries()]).toEqual(beforeDecks);
    expect([...client.cards.entries()]).toEqual(beforeCards);
    expect(client.decks.get(personalDeck.seedKey)).toEqual(personalDeck);
    expect(client.cards.get(personalCard.seedKey)).toEqual(personalCard);
  });

  it("updates changed sample content without touching personal records", async () => {
    const client = createMemoryClient();
    client.decks.set("personal-deck", {
      id: 100,
      seedKey: "personal-deck",
      userId: 8,
      visibility: "PERSONAL",
      name: "Personal",
      description: "Not seed data",
    });
    client.cards.set("personal-card", {
      id: 100,
      seedKey: "personal-card",
      deckId: 100,
      front: "mine",
      back: "my answer",
      position: 1,
    });

    const source = {
      vocabulary: [...vocabulary(5, 50), ...vocabulary(4, 50)],
      grammars: grammar(20),
    };
    await seedFlashcardDecks(client, source);
    source.vocabulary[0].senses[0].glosses[0].text = "updated meaning";
    await seedFlashcardDecks(client, source);

    expect(client.cards.get("flashcard:vocabulary-n5:1")?.back).toContain(
      "updated meaning",
    );
    expect(client.decks.get("personal-deck")).toMatchObject({
      id: 100,
      userId: 8,
    });
    expect(client.cards.get("personal-card")).toMatchObject({
      deckId: 100,
      front: "mine",
      back: "my answer",
    });
    expect(client.decks.size).toBe(4);
    expect(client.cards.size).toBe(81);
  });
});
