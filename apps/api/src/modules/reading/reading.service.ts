import { prisma } from "../../lib/prisma.js";

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
