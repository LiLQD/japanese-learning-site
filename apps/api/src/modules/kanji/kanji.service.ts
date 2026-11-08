import type { KanjiListQuery } from "@app/shared";
import { Prisma } from "../../../generated/prisma/client.js";
import { conflict, notFound } from "../../errors.js";
import { prisma } from "../../lib/prisma.js";

const DUPLICATE_KANJI_MESSAGE = "Chữ Kanji này đã tồn tại trong hệ thống!";
const KANJI_NOT_FOUND_MESSAGE = "Không tìm thấy chữ Kanji này!";

type KanjiData = {
  character: string;
  jlpt: number;
  strokeCount?: number | null;
  radical?: string | null;
};

const kanjiListSelect = {
  id: true,
  character: true,
  strokeCount: true,
  radical: true,
  jlpt: true,
  createdAt: true,
} as const;

const kanjiDetailSelect = {
  id: true,
  character: true,
  strokeCount: true,
  radical: true,
  jlpt: true,
  grade: true,
  createdAt: true,
  wordKanjis: {
    select: {
      word: {
        select: {
          id: true,
          text: true,
          jlpt: true,
          readings: {
            select: { kana: true, isPrimary: true },
            orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
          },
          senses: {
            select: {
              glosses: {
                where: { lang: "vi" },
                select: { text: true },
                orderBy: { id: "asc" },
              },
            },
            orderBy: [{ position: "asc" }, { id: "asc" }],
          },
        },
      },
    },
    orderBy: [
      { word: { text: "asc" } },
      { wordId: "asc" },
      { position: "asc" },
    ],
  },
} satisfies Prisma.KanjiSelect;

type KanjiDetailRecord = Prisma.KanjiGetPayload<{
  select: typeof kanjiDetailSelect;
}>;

function isPrismaError(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function toKanjiRow(data: KanjiData) {
  return {
    character: data.character,
    jlpt: data.jlpt,
    strokeCount: data.strokeCount ?? null,
    radical: data.radical ?? null,
  };
}

export async function listKanji({ page, pageSize, keyword }: KanjiListQuery) {
  const where: Prisma.KanjiWhereInput = keyword
    ? {
        OR: [
          { character: { contains: keyword } },
          { radical: { contains: keyword } },
        ],
      }
    : {};

  const [kanji, total] = await prisma.$transaction([
    prisma.kanji.findMany({
      where,
      select: kanjiListSelect,
      orderBy: { id: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.kanji.count({ where }),
  ]);

  return { kanji, total, page, pageSize };
}

export async function getKanjiById(id: number) {
  const kanji = await prisma.kanji.findUnique({
    where: { id },
    select: kanjiDetailSelect,
  });

  if (!kanji) {
    throw notFound(KANJI_NOT_FOUND_MESSAGE);
  }

  return toKanjiDetail(kanji);
}

function toKanjiDetail(kanji: KanjiDetailRecord) {
  const wordsById = new Map<
    number,
    {
      id: number;
      text: string;
      jlpt: number | null;
      readings: string[];
      meanings: string[];
    }
  >();

  for (const { word } of kanji.wordKanjis) {
    if (wordsById.has(word.id)) continue;

    wordsById.set(word.id, {
      id: word.id,
      text: word.text,
      jlpt: word.jlpt,
      readings: word.readings.map((reading) => reading.kana),
      meanings: word.senses.flatMap((sense) =>
        sense.glosses.map((gloss) => gloss.text),
      ),
    });
  }

  const { wordKanjis: _wordKanjis, ...detail } = kanji;
  return {
    ...detail,
    words: [...wordsById.values()],
  };
}

export async function createKanji(data: KanjiData) {
  try {
    return await prisma.kanji.create({
      data: toKanjiRow(data),
      select: kanjiListSelect,
    });
  } catch (error) {
    // P2002 = unique constraint violation on kanji.character.
    if (isPrismaError(error, "P2002")) {
      throw conflict(DUPLICATE_KANJI_MESSAGE);
    }

    throw error;
  }
}

export async function updateKanji(id: number, data: KanjiData) {
  try {
    return await prisma.kanji.update({
      where: { id },
      data: toKanjiRow(data),
      select: kanjiListSelect,
    });
  } catch (error) {
    // P2025 = the row to update does not exist (e.g. deleted meanwhile).
    if (isPrismaError(error, "P2025")) {
      throw notFound(KANJI_NOT_FOUND_MESSAGE);
    }

    if (isPrismaError(error, "P2002")) {
      throw conflict(DUPLICATE_KANJI_MESSAGE);
    }

    throw error;
  }
}

// Deleting a kanji also removes its word_kanji links (onDelete: Cascade);
// the words themselves are kept.
export async function deleteKanji(id: number) {
  try {
    await prisma.kanji.delete({ where: { id } });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw notFound(KANJI_NOT_FOUND_MESSAGE);
    }

    throw error;
  }
}
