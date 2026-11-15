import { badRequest, notFound } from "../../errors.js";
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

export async function getReadingQuestionsByPassageId(passageId: number) {
  const passage = await prisma.readingPassage.findUnique({
    where: { id: passageId },
    select: { id: true },
  });

  if (!passage) {
    return null; // Không tìm thấy bài đọc
  }

  const questions = await prisma.readingQuestion.findMany({
    where: { passageId },
    select: {
      id: true,
      question: true,
      options: true,
      position: true,
      // Tuyệt đối không select correctIndex ở đây để bảo mật
    },
    orderBy: { position: "asc" },
  });

  return questions;
}

export async function submitReadingQuiz(
  userId: number,
  passageId: number,
  timeSpent: number,
  answers: { questionId: number; selectedOption: number }[],
) {
  const questions = await prisma.readingQuestion.findMany({
    where: { passageId },
  });

  if (questions.length === 0) {
    throw notFound("Bài đọc chưa có câu hỏi.");
  }

  const totalCount = questions.length;

  if (answers.length !== totalCount) {
    throw badRequest(`Vui lòng trả lời đủ ${totalCount} câu hỏi.`);
  }

  const uniqueIds = new Set(answers.map((a) => a.questionId));
  if (uniqueIds.size !== totalCount) {
    throw badRequest("Dữ liệu câu trả lời bị trùng lặp.");
  }

  const answerMap = new Map(
    answers.map((a) => [a.questionId, a.selectedOption]),
  );

  let correctCount = 0;
  const detailsData: {
    questionId: number;
    selectedOption: number;
    isCorrect: boolean;
  }[] = [];

  for (const q of questions) {
    const selectedOption = answerMap.get(q.id);

    if (selectedOption === undefined) {
      throw badRequest("Danh sách câu trả lời không khớp với bài đọc.");
    }

    if (selectedOption < 0 || selectedOption >= q.options.length) {
      throw badRequest("Lựa chọn câu trả lời không hợp lệ.");
    }

    const isCorrect = q.correctIndex === selectedOption;
    if (isCorrect) correctCount++;

    detailsData.push({
      questionId: q.id,
      selectedOption,
      isCorrect,
    });
  }

  const score = Number(((correctCount / totalCount) * 10).toFixed(2));

  const result = await prisma.$transaction(async (tx) => {
    const readingResult = await tx.readingResult.create({
      data: {
        userId,
        passageId,
        score,
        correctCount,
        totalCount,
        timeSpent,
      },
    });

    await tx.readingResultDetail.createMany({
      data: detailsData.map((d) => ({
        resultId: readingResult.id,
        questionId: d.questionId,
        selectedOption: d.selectedOption,
        isCorrect: d.isCorrect,
      })),
    });

    return readingResult;
  });

  return {
    result,
    details: detailsData,
  };
}

export async function getReadingResultById(resultId: number, userId: number) {
  const result = await prisma.readingResult.findFirst({
    where: {
      id: resultId,
      userId,
    },
    select: {
      id: true,
      score: true,
      correctCount: true,
      totalCount: true,
      timeSpent: true,
      createdAt: true,

      passage: {
        select: {
          id: true,
          title: true,
          jlpt: true,
        },
      },

      details: {
        select: {
          id: true,
          selectedOption: true,
          isCorrect: true,

          question: {
            select: {
              id: true,
              question: true,
              options: true,
              correctIndex: true,
              position: true,
            },
          },
        },
        orderBy: {
          question: {
            position: "asc",
          },
        },
      },
    },
  });

  return result;
}
