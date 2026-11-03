import type { KanjiListQuery } from "@app/shared";
import { prisma } from "../../lib/prisma.js";

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
