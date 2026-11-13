import type { GrammarListQuery } from "@app/shared";
import { notFound } from "../../errors.js";
import { prisma } from "../../lib/prisma.js";

const GRAMMAR_NOT_FOUND_MESSAGE = "Không tìm thấy ngữ pháp này!";

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

export async function getGrammarById(id: number) {
  const grammar = await prisma.grammar.findUnique({
    where: { id },
    select: grammarListSelect,
  });

  if (!grammar) {
    throw notFound(GRAMMAR_NOT_FOUND_MESSAGE);
  }

  return grammar;
}
