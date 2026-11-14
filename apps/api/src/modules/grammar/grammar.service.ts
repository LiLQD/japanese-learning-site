import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../errors.js";
import type { GrammarCreateInput, GrammarListQuery } from "@app/shared";
import type { Prisma } from "../../../generated/prisma/client.js";

const GRAMMAR_NOT_FOUND_MESSAGE = "Không tìm thấy ngữ pháp";

const grammarListSelect = {
  id: true,
  title: true,
  pattern: true,
  meaning: true,
  jlpt: true,
} satisfies Prisma.GrammarSelect;

export async function createGrammar(data: GrammarCreateInput) {
  const examples = data.examples ?? [];

  return prisma.grammar.create({
    data: {
      title: data.title,
      pattern: data.pattern,
      meaning: data.meaning,
      jlpt: data.jlpt,
      ...(examples.length > 0 && {
        examples: {
          create: examples.map((example, index) => ({
            japanese: example.japanese,
            english: example.vietnamese,
            position: index + 1,
          })),
        },
      }),
    },
    select: grammarListSelect,
  });
}

function buildWhere({
  keyword,
  jlpt,
}: GrammarListQuery): Prisma.GrammarWhereInput {
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

export async function listGrammars(query: GrammarListQuery) {
  const where = buildWhere(query);

  const [grammars, total] = await prisma.$transaction([
    prisma.grammar.findMany({
      where,
      select: grammarListSelect,
      orderBy: [{ jlpt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.grammar.count({ where }),
  ]);

  return {
    grammars,
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
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
