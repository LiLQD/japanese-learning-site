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
  // Lấy toàn bộ câu hỏi kèm đáp án đúng từ DB
  const questions = await prisma.readingQuestion.findMany({
    where: { passageId },
  });

  if (!questions || questions.length === 0) {
    throw new Error("Bài đọc chưa có câu hỏi.");
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  let correctCount = 0;
  const totalCount = questions.length;

  const detailsData = answers.map((ans) => {
    const q = questionMap.get(Number(ans.questionId));
    // Ép kiểu về Number để so sánh chính xác tránh lệch kiểu dữ liệu
    const isCorrect = q
      ? Number(q.correctIndex) === Number(ans.selectedOption)
      : false;
    if (isCorrect) correctCount++;

    return {
      questionId: Number(ans.questionId),
      selectedOption: Number(ans.selectedOption),
      isCorrect,
    };
  });

  const score = Number(((correctCount / totalCount) * 10).toFixed(2)); // Tính điểm hệ số 10

  // Sử dụng Prisma Transaction đảm bảo tính nhất quán
  const result = await prisma.$transaction(async (tx) => {
    const readingResult = await tx.readingResult.create({
      data: {
        userId: Number(userId),
        passageId: Number(passageId),
        score,
        correctCount,
        totalCount,
        timeSpent: Number(timeSpent || 0),
      },
    });

    if (detailsData.length > 0) {
      await tx.readingResultDetail.createMany({
        data: detailsData.map((d) => ({
          resultId: readingResult.id,
          questionId: d.questionId,
          selectedOption: d.selectedOption,
          isCorrect: d.isCorrect,
        })),
      });
    }

    return readingResult;
  });

  return {
    result,
    details: detailsData,
  };
}
