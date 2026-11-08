import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function syncWordKanji(): Promise<void> {
  const [words, kanji, existingLinks] = await Promise.all([
    prisma.word.findMany({ select: { id: true, text: true } }),
    prisma.kanji.findMany({ select: { id: true, character: true } }),
    prisma.wordKanji.findMany({
      select: { wordId: true, kanjiId: true, position: true },
    }),
  ]);
  const kanjiByCharacter = new Map(
    kanji.map((item) => [item.character, item.id]),
  );
  const existingByWordPosition = new Map(
    existingLinks.map((link) => [
      `${link.wordId}:${link.position}`,
      link.kanjiId,
    ]),
  );
  const missingLinks: { wordId: number; kanjiId: number; position: number }[] =
    [];
  let alreadyExisted = 0;
  let conflictingPositions = 0;

  for (const word of words) {
    const characters = Array.from(
      new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(word.text),
      ({ segment }) => segment,
    );

    for (const [index, character] of characters.entries()) {
      const kanjiId = kanjiByCharacter.get(character);
      if (kanjiId === undefined) continue;

      const position = index + 1;
      const existingKanjiId = existingByWordPosition.get(
        `${word.id}:${position}`,
      );

      if (existingKanjiId !== undefined) {
        if (existingKanjiId === kanjiId) {
          alreadyExisted += 1;
        } else {
          conflictingPositions += 1;
        }
        continue;
      }

      missingLinks.push({ wordId: word.id, kanjiId, position });
    }
  }

  const created = missingLinks.length
    ? await prisma.wordKanji.createMany({
        data: missingLinks,
        skipDuplicates: true,
      })
    : { count: 0 };

  const linksAfterSync = await prisma.wordKanji.findMany({
    select: { wordId: true, kanjiId: true, position: true },
  });
  const linksAfterByWordPosition = new Map(
    linksAfterSync.map((link) => [
      `${link.wordId}:${link.position}`,
      link.kanjiId,
    ]),
  );
  let candidateLinksPresent = 0;
  let candidateConflicts = 0;
  let unresolvedCandidates = 0;

  for (const candidate of missingLinks) {
    const kanjiId = linksAfterByWordPosition.get(
      `${candidate.wordId}:${candidate.position}`,
    );

    if (kanjiId === candidate.kanjiId) {
      candidateLinksPresent += 1;
    } else if (kanjiId === undefined) {
      unresolvedCandidates += 1;
    } else {
      candidateConflicts += 1;
    }
  }

  // createMany reports inserts, while the reread distinguishes correct links
  // that already existed (including concurrent inserts) from conflicts.
  alreadyExisted += Math.max(0, candidateLinksPresent - created.count);
  conflictingPositions += candidateConflicts;

  console.log(`Word-Kanji links created: ${created.count}`);
  console.log(`Word-Kanji links already existed correctly: ${alreadyExisted}`);
  console.log(`Word-Kanji position conflicts: ${conflictingPositions}`);
  console.log(
    `Word-Kanji candidates unresolved after sync: ${unresolvedCandidates}`,
  );
  if (conflictingPositions > 0) {
    console.warn(
      `Word-Kanji links were not added because their positions belong to another Kanji: ${conflictingPositions}`,
    );
  }
  if (unresolvedCandidates > 0) {
    console.warn(
      `Word-Kanji candidates were not present after synchronization: ${unresolvedCandidates}`,
    );
  }
}

syncWordKanji()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
