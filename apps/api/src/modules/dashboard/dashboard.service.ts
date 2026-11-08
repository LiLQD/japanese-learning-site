import { prisma } from "../../lib/prisma.js";

export async function getDashboardStatistics() {
  const [
    totalUsers,
    activeUsers,
    lockedUsers,
    totalVocabulary,
    totalGrammar,
    totalKanji,
    totalReading,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "USER" },
    }),
    prisma.user.count({
      where: { role: "USER", status: "ACTIVE" },
    }),
    prisma.user.count({
      where: { role: "USER", status: "LOCKED" },
    }),
    prisma.word.count(),
    prisma.grammar.count(),
    prisma.kanji.count(),
    prisma.readingPassage.count(),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      locked: lockedUsers,
    },
    content: {
      vocabulary: totalVocabulary,
      grammar: totalGrammar,
      kanji: totalKanji,
      reading: totalReading,
    },
  };
}
