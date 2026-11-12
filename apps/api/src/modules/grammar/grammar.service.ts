import type { GrammarListQuery } from "@app/shared";
import { prisma } from "../../lib/prisma.js";

const grammarListSelect = {
  id: true,
  title: true,
  pattern: true,
  meaning: true,
  jlpt: true,
} as const;

export async function listGrammars({ page, pageSize }: GrammarListQuery) {
  const [grammars, total] = await prisma.$transaction([
    prisma.grammar.findMany({
      select: grammarListSelect,
      // Easiest first: N5 (jlpt = 5) … N1, then by id. Unknown level last.
      orderBy: [{ jlpt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.grammar.count(),
  ]);

  return { grammars, total, page, pageSize };
}
