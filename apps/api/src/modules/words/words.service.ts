import type { WordListQuery } from "@app/shared";
import { toRomaji } from "wanakana";
import type { Prisma } from "../../../generated/prisma/client.js";
import { notFound } from "../../errors.js";
import { prisma } from "../../lib/prisma.js";

const WORD_NOT_FOUND_MESSAGE = "Không tìm thấy từ vựng phù hợp";

const partOfSpeechLabels: Record<string, string> = {
  n: "Danh từ",
  v1: "Động từ nhóm II",
  v5m: "Động từ nhóm I",
  "v5k-s": "Động từ nhóm I (bất quy tắc 行く)",
  vk: "Động từ bất quy tắc (くる)",
  "adj-i": "Tính từ -i",
  vt: "Ngoại động từ",
  vi: "Nội động từ",
};

const wordSelect = {
  id: true,
  text: true,
  jlpt: true,
  readings: {
    select: {
      id: true,
      kana: true,
      isPrimary: true,
    },
    orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
  },
  senses: {
    select: {
      id: true,
      partOfSpeech: true,
      position: true,
      glosses: {
        where: { lang: "vi" },
        select: { text: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.WordSelect;

type WordRecord = Prisma.WordGetPayload<{ select: typeof wordSelect }>;

export type WordLookup = {
  id: number;
  text: string;
  jlpt: number | null;
  kana: string | null;
  romaji: string | null;
  senses: {
    position: number;
    partOfSpeech: string[];
    meanings: string[];
  }[];
};

function toWordLookup(word: WordRecord): WordLookup {
  const kana = word.readings[0]?.kana ?? null;

  return {
    id: word.id,
    text: word.text,
    jlpt: word.jlpt,
    kana,
    romaji: kana === null ? null : toRomaji(kana),
    senses: word.senses.map((sense) => ({
      position: sense.position,
      partOfSpeech: sense.partOfSpeech.map(
        (code) => partOfSpeechLabels[code] ?? code,
      ),
      meanings: sense.glosses.map((gloss) => gloss.text),
    })),
  };
}

export async function listWords({ q, page, pageSize }: WordListQuery) {
  const where: Prisma.WordWhereInput = q
    ? {
        OR: [
          { text: { contains: q, mode: "insensitive" } },
          {
            readings: {
              some: { kana: { contains: q, mode: "insensitive" } },
            },
          },
          {
            senses: {
              some: {
                glosses: {
                  some: {
                    lang: "vi",
                    text: { contains: q, mode: "insensitive" },
                  },
                },
              },
            },
          },
        ],
      }
    : {};

  const [words, total] = await prisma.$transaction([
    prisma.word.findMany({
      where,
      select: wordSelect,
      orderBy: [{ text: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.word.count({ where }),
  ]);

  return {
    words: words.map(toWordLookup),
    total,
    page,
    pageSize,
  };
}

export async function getWordById(id: number) {
  const word = await prisma.word.findUnique({
    where: { id },
    select: wordSelect,
  });

  if (!word) {
    throw notFound(WORD_NOT_FOUND_MESSAGE);
  }

  return toWordLookup(word);
}
