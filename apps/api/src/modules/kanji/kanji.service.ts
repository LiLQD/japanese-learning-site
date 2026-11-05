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

export async function getKanjiById(id: number) {
  const kanji = await prisma.kanji.findUnique({
    where: { id },
    select: kanjiListSelect,
  });

  if (!kanji) {
    throw notFound(KANJI_NOT_FOUND_MESSAGE);
  }

  return kanji;
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
