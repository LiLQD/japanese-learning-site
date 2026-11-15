import { z } from "zod";

export const readingInputSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề"),
  content: z.string().trim().min(1, "Vui lòng nhập nội dung tiếng Nhật"),
  translation: z.string().trim().optional().nullable(),
  jlpt: z.coerce.number().int().min(1).max(5).optional().nullable(),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(1, "Vui lòng nhập câu hỏi"),
        options: z
          .array(z.string())
          .length(4, "Phải có đúng 4 đáp án A, B, C, D"),
        correctIndex: z.coerce.number().int().min(0).max(3),
        position: z.number().int().min(1),
      }),
    )
    .optional()
    .default([]),
});

export type ReadingInput = z.infer<typeof readingInputSchema>;

export type ReadingQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  position: number;
};

export type ReadingPassage = {
  id: number;
  title: string;
  content: string;
  translation: string | null;
  jlpt: number | null;
  questions?: ReadingQuestion[];
  createdAt?: string;
  updatedAt?: string;
};
