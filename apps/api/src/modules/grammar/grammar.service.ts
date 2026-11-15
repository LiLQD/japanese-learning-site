import { prisma } from "../../lib/prisma.js";
import { badRequest, notFound } from "../../errors.js";
import type {
  GrammarCreateInput,
  GrammarListQuery,
  GrammarUpdateInput,
} from "@app/shared";
import type { Prisma } from "../../../generated/prisma/client.js";

const GRAMMAR_NOT_FOUND_MESSAGE = "Không tìm thấy ngữ pháp";

const grammarListSelect = {
  id: true,
  title: true,
  pattern: true,
  meaning: true,
  jlpt: true,
} satisfies Prisma.GrammarSelect;

const grammarAdminDetailSelect = {
  ...grammarListSelect,
  examples: {
    select: {
      id: true,
      japanese: true,
      reading: true,
      english: true,
      position: true,
    },
    orderBy: { position: "asc" },
  },
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
            reading: example.reading ?? null,
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

export async function getAdminGrammarById(id: number) {
  const grammar = await prisma.grammar.findUnique({
    where: { id },
    select: grammarAdminDetailSelect,
  });

  if (!grammar) {
    throw notFound(GRAMMAR_NOT_FOUND_MESSAGE);
  }

  return mapAdminGrammarExamples(grammar);
}

export async function updateGrammar(id: number, input: GrammarUpdateInput) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.grammar.findUnique({
      where: { id },
      select: { id: true, examples: { select: { id: true } } },
    });

    if (!current) {
      throw notFound(GRAMMAR_NOT_FOUND_MESSAGE);
    }

    const currentExampleIds = new Set(
      current.examples.map((example) => example.id),
    );
    const submittedExistingIds = (input.examples ?? [])
      .map((example) => example.id)
      .filter((exampleId): exampleId is number => exampleId !== undefined);

    if (
      submittedExistingIds.some(
        (exampleId) => !currentExampleIds.has(exampleId),
      )
    ) {
      throw badRequest("Ví dụ không thuộc dữ liệu ngữ pháp này");
    }

    const data: Prisma.GrammarUpdateInput = {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.pattern !== undefined && { pattern: input.pattern }),
      ...(input.meaning !== undefined && { meaning: input.meaning }),
      ...(input.jlpt !== undefined && { jlpt: input.jlpt }),
      ...(input.examples !== undefined && {
        examples: {
          deleteMany:
            submittedExistingIds.length > 0
              ? { id: { notIn: submittedExistingIds } }
              : {},
          update: input.examples.flatMap((example, position) =>
            example.id === undefined
              ? []
              : [
                  {
                    where: { id: example.id },
                    data: {
                      japanese: example.japanese,
                      reading: example.reading ?? null,
                      english: example.vietnamese,
                      position: position + 1,
                    },
                  },
                ],
          ),
          create: input.examples.flatMap((example, position) =>
            example.id !== undefined
              ? []
              : [
                  {
                    japanese: example.japanese,
                    reading: example.reading ?? null,
                    english: example.vietnamese,
                    position: position + 1,
                  },
                ],
          ),
        },
      }),
    };

    const grammar = await tx.grammar.update({
      where: { id },
      data,
      select: grammarAdminDetailSelect,
    });

    return mapAdminGrammarExamples(grammar);
  });
}

export async function deleteGrammar(id: number) {
  const grammar = await prisma.grammar.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!grammar) {
    throw notFound(GRAMMAR_NOT_FOUND_MESSAGE);
  }

  await prisma.grammar.delete({ where: { id } });
}

function mapAdminGrammarExamples<
  T extends { examples: Array<{ english: string }> },
>(grammar: T) {
  return {
    ...grammar,
    examples: grammar.examples.map(({ english, ...example }) => ({
      ...example,
      vietnamese: english,
    })),
  };
}
