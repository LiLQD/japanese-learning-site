import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

type SeedVocabulary = {
  text: string;
  jlpt: number;
  readings: { kana: string; isPrimary: boolean }[];
  senses: { glosses: { lang: string; text: string }[] }[];
};

type SeedGrammar = {
  pattern: string;
  meaning: string;
  usage: string;
  jlpt: number;
  examples: { japanese: string; vietnamese: string }[];
};

type FlashcardSeedSource = {
  vocabulary: SeedVocabulary[];
  grammars: SeedGrammar[];
};

type FlashcardSeedCard = {
  seedKey: string;
  front: string;
  back: string;
  position: number;
};

type FlashcardSeedDeck = {
  seedKey: string;
  name: string;
  description: string;
  cards: FlashcardSeedCard[];
};

export type FlashcardSeedClient = Pick<
  Prisma.TransactionClient,
  "flashcardDeck" | "flashcard"
>;

export type FlashcardSeedDatabaseClient = Pick<PrismaClient, "$transaction">;

const vocabularyDecks = [
  {
    level: 5,
    seedKey: "vocabulary-n5",
    name: "Từ vựng tiếng Nhật N5",
    description: "30 từ vựng N5 với cách đọc và nghĩa tiếng Việt.",
  },
  {
    level: 4,
    seedKey: "vocabulary-n4",
    name: "Từ vựng tiếng Nhật N4",
    description: "30 từ vựng N4 với cách đọc và nghĩa tiếng Việt.",
  },
] as const;

function vocabularyCards(
  vocabulary: SeedVocabulary[],
  level: 4 | 5,
  seedKey: string,
  excludedWords: Set<string>,
): FlashcardSeedCard[] {
  const selected: { word: SeedVocabulary; reading: string; meaning: string }[] =
    [];
  const seenWords = new Set(excludedWords);

  for (const word of vocabulary) {
    if (word.jlpt !== level || seenWords.has(word.text)) {
      continue;
    }

    const reading =
      word.readings.find((item) => item.isPrimary)?.kana ??
      word.readings[0]?.kana;
    const meanings = word.senses.flatMap((sense) =>
      sense.glosses
        .filter((gloss) => gloss.lang === "vi")
        .map((gloss) => gloss.text),
    );

    if (!reading || meanings.length === 0) {
      continue;
    }

    seenWords.add(word.text);
    selected.push({ word, reading, meaning: meanings.join("; ") });
    if (selected.length === 30) {
      break;
    }
  }

  if (selected.length < 30) {
    throw new Error(
      `Flashcard seed requires at least 30 N${level} vocabulary entries with Vietnamese glosses and readings.`,
    );
  }

  return selected.map(({ word, reading, meaning }, index) => {
    const position = index + 1;
    return {
      seedKey: `flashcard:${seedKey}:${position}`,
      front: word.text,
      back: `${reading} — ${meaning}`,
      position,
    };
  });
}

export function buildFlashcardDeckSeeds(
  source: FlashcardSeedSource,
): FlashcardSeedDeck[] {
  const sharedWords = new Set<string>();
  const decks: FlashcardSeedDeck[] = vocabularyDecks.map((deck) => {
    const cards = vocabularyCards(
      source.vocabulary,
      deck.level,
      deck.seedKey,
      sharedWords,
    );
    for (const card of cards) {
      sharedWords.add(card.front);
    }

    return {
      seedKey: deck.seedKey,
      name: deck.name,
      description: deck.description,
      cards,
    };
  });

  const grammarDeckKey = "grammar-n5";
  const n5Grammars: SeedGrammar[] = [];
  const seenPatterns = new Set<string>();

  for (const grammar of source.grammars) {
    if (grammar.jlpt !== 5 || seenPatterns.has(grammar.pattern)) {
      continue;
    }

    seenPatterns.add(grammar.pattern);
    n5Grammars.push(grammar);
    if (n5Grammars.length === 20) {
      break;
    }
  }

  if (n5Grammars.length < 20) {
    throw new Error("Flashcard seed requires 20 N5 grammar entries.");
  }

  const grammarCards = n5Grammars.map((grammar, index) => {
    const example = grammar.examples[0];
    if (!grammar.usage || !example?.japanese || !example.vietnamese) {
      throw new Error(
        `Flashcard seed requires usage and a Japanese/Vietnamese example for ${grammar.pattern}.`,
      );
    }

    const position = index + 1;
    return {
      seedKey: `flashcard:${grammarDeckKey}:${position}`,
      front: grammar.pattern,
      back: [
        `Ý nghĩa: ${grammar.meaning}`,
        `Cách dùng: ${grammar.usage}`,
        `Ví dụ: ${example.japanese}`,
        `Dịch: ${example.vietnamese}`,
      ].join("\n"),
      position,
    };
  });

  decks.push({
    seedKey: grammarDeckKey,
    name: "Ngữ pháp tiếng Nhật N5",
    description: "20 cấu trúc ngữ pháp N5 kèm giải thích và ví dụ.",
    cards: grammarCards,
  });

  return decks;
}

export async function seedFlashcardDecks(
  prisma: FlashcardSeedDatabaseClient,
  source: FlashcardSeedSource,
): Promise<void> {
  const decks = buildFlashcardDeckSeeds(source);
  await prisma.$transaction(async (transaction) => {
    await seedFlashcardDecksInTransaction(transaction, decks);
  });
}

async function seedFlashcardDecksInTransaction(
  prisma: FlashcardSeedClient,
  decks: FlashcardSeedDeck[],
): Promise<void> {
  const existingDecks = new Map<
    string,
    {
      id: number;
      visibility: "PERSONAL" | "SHARED";
      userId: number | null;
    } | null
  >();

  for (const deck of decks) {
    const existing = await prisma.flashcardDeck.findUnique({
      where: { seedKey: deck.seedKey },
      select: { id: true, visibility: true, userId: true },
    });

    if (
      existing &&
      (existing.visibility !== "SHARED" || existing.userId !== null)
    ) {
      throw new Error(
        `Flashcard deck seedKey "${deck.seedKey}" belongs to a personal deck or has an owner.`,
      );
    }

    existingDecks.set(deck.seedKey, existing);
  }

  const existingCards = new Map<
    string,
    { id: number; deckId: number } | null
  >();

  for (const deck of decks) {
    const existingDeck = existingDecks.get(deck.seedKey);

    for (const card of deck.cards) {
      const existing = await prisma.flashcard.findUnique({
        where: { seedKey: card.seedKey },
        select: { id: true, deckId: true },
      });

      if (existing && (!existingDeck || existing.deckId !== existingDeck.id)) {
        throw new Error(
          `Flashcard seedKey "${card.seedKey}" belongs to a different deck.`,
        );
      }

      existingCards.set(card.seedKey, existing);
    }
  }

  for (const deck of decks) {
    const existing = existingDecks.get(deck.seedKey);
    let deckId: number;

    if (existing) {
      const updated = await prisma.flashcardDeck.updateMany({
        where: {
          id: existing.id,
          seedKey: deck.seedKey,
          visibility: "SHARED",
          userId: null,
        },
        data: { name: deck.name, description: deck.description },
      });
      if (updated.count !== 1) {
        throw new Error(
          `Flashcard deck seedKey "${deck.seedKey}" changed ownership or visibility while seeding.`,
        );
      }
      deckId = existing.id;
    } else {
      const created = await prisma.flashcardDeck.create({
        data: {
          seedKey: deck.seedKey,
          name: deck.name,
          description: deck.description,
          visibility: "SHARED",
          userId: null,
        },
        select: { id: true },
      });
      deckId = created.id;
    }
    for (const card of deck.cards) {
      const existingCard = existingCards.get(card.seedKey);
      if (existingCard) {
        const updated = await prisma.flashcard.updateMany({
          where: {
            id: existingCard.id,
            seedKey: card.seedKey,
            deckId,
          },
          data: {
            front: card.front,
            back: card.back,
            position: card.position,
          },
        });
        if (updated.count !== 1) {
          throw new Error(
            `Flashcard seedKey "${card.seedKey}" changed decks while seeding.`,
          );
        }
      } else {
        await prisma.flashcard.create({
          data: { ...card, deckId },
        });
      }
    }
  }
}
