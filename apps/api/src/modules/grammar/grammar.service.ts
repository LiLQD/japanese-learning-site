import type { GrammarListQuery } from "@app/shared";
import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const grammarListSelect = {
  id: true,
  title: true,
  pattern: true,
  meaning: true,
  jlpt: true,
} as const;

function buildWhere({
  keyword,
  jlpt,
}: Pick<GrammarListQuery, "keyword" | "jlpt">): Prisma.GrammarWhereInput {
  const where: Prisma.GrammarWhereInput = {};

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { pattern: { contains: keyword, mode: "insensitive" } },
      { meaning: { contains: keyword, mode: "insensitive" } },
    ];
  }

  if (jlpt) {
    where.jlpt = jlpt;
  }

  return where;
}

export async function listGrammars({
  page,
  pageSize,
  keyword,
  jlpt,
}: GrammarListQuery) {
  const where = buildWhere({ keyword, jlpt });

  const [grammars, total] = await prisma.$transaction([
    prisma.grammar.findMany({
      where,
      select: grammarListSelect,
      // Easiest first: N5 (jlpt = 5) … N1, then by id. Unknown level last.
      orderBy: [{ jlpt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.grammar.count({ where }),
  ]);

  return { grammars, total, page, pageSize };
}
