import type { KanjiListQuery } from "@app/shared";
import { Prisma } from "../../../generated/prisma/client.js";
import { conflict } from "../../errors.js";
import { prisma } from "../../lib/prisma.js";

const DUPLICATE_KANJI_MESSAGE = "Chữ Kanji này đã tồn tại trong hệ thống!";

type CreateKanjiData = {
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

export async function listKanji({ page, pageSize }: KanjiListQuery) {
  const [kanji, total] = await prisma.$transaction([
    prisma.kanji.findMany({
      select: kanjiListSelect,
      orderBy: { id: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.kanji.count(),
  ]);

  return { kanji, total, page, pageSize };
}

export async function createKanji(data: CreateKanjiData) {
  try {
    return await prisma.kanji.create({
      data: {
        character: data.character,
        jlpt: data.jlpt,
        strokeCount: data.strokeCount ?? null,
        radical: data.radical ?? null,
      },
      select: kanjiListSelect,
    });
  } catch (error) {
    // P2002 = unique constraint violation on kanji.character.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict(DUPLICATE_KANJI_MESSAGE);
    }

    throw error;
  }
}
