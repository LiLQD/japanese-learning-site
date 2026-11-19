import { z } from "zod";

export type FlashcardDeckListItem = {
  id: number;
  name: string;
  description: string | null;
  visibility: "PERSONAL" | "SHARED";
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardDeckListResponse = {
  decks: FlashcardDeckListItem[];
};

export type FlashcardItem = {
  id: number;
  front: string;
  back: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardDeckDetail = FlashcardDeckListItem & {
  cards: FlashcardItem[];
};

export type FlashcardDeckDetailResponse = {
  deck: FlashcardDeckDetail;
};

export const flashcardDeckIdParamSchema = z.object({
  deckId: z.coerce
    .number({ error: "Mã bộ flashcard không hợp lệ" })
    .int("Mã bộ flashcard không hợp lệ")
    .positive("Mã bộ flashcard không hợp lệ"),
});

export const flashcardCardParamsSchema = flashcardDeckIdParamSchema.extend({
  cardId: z.coerce
    .number({ error: "Mã flashcard không hợp lệ" })
    .int("Mã flashcard không hợp lệ")
    .positive("Mã flashcard không hợp lệ"),
});

export const flashcardDeckCreateInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên bộ flashcard")
    .max(120, "Tên bộ flashcard tối đa 120 ký tự"),
  description: z
    .string()
    .trim()
    .max(500, "Mô tả tối đa 500 ký tự")
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
});

export const flashcardCardCreateInputSchema = z.object({
  front: z.string().trim().min(1, "Vui lòng nhập mặt trước flashcard"),
  back: z.string().trim().min(1, "Vui lòng nhập mặt sau flashcard"),
});

export const flashcardCardUpdateInputSchema = flashcardCardCreateInputSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Cần cung cấp ít nhất một trường để cập nhật",
  });

export type FlashcardDeckCreateInput = z.input<
  typeof flashcardDeckCreateInputSchema
>;
export type FlashcardCardCreateInput = z.input<
  typeof flashcardCardCreateInputSchema
>;
export type FlashcardCardUpdateInput = z.input<
  typeof flashcardCardUpdateInputSchema
>;
