import { prisma } from "../../lib/prisma.js";
import type { ReadingInput } from "@app/shared";

export async function listReadingPassages() {
  const passages = await prisma.readingPassage.findMany({
    select: {
      id: true,
      title: true,
      jlpt: true,
    },
    orderBy: [{ jlpt: "asc" }, { title: "asc" }, { id: "asc" }],
  });

  return { passages };
}

export async function getReadingPassageById(id: number) {
  return prisma.readingPassage.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      translation: true,
      jlpt: true,
    },
  });
}

export async function createReading(data: ReadingInput) {
  const existing = await prisma.readingPassage.findFirst({
    where: { title: data.title },
  });
  if (existing) {
    throw new Error("Bài đọc đã tồn tại");
  }

  return prisma.readingPassage.create({
    data: {
      title: data.title,
      content: data.content,
      translation: data.translation ?? null,
      jlpt: data.jlpt ?? null,
      questions: {
        create: data.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          position: q.position,
        })),
      },
    },
    include: { questions: true },
  });
}

export async function updateReading(id: number, data: ReadingInput) {
  return prisma.readingPassage.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      translation: data.translation ?? null,
      jlpt: data.jlpt ?? null,
      questions: {
        deleteMany: {},
        create: data.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          position: q.position,
        })),
      },
    },
    include: { questions: true },
  });
}

export async function deleteReading(id: number) {
  return prisma.readingPassage.delete({ where: { id } });
}
