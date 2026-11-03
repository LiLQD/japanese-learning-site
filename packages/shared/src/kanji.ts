import { z } from "zod";

export const kanjiListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Số trang phải là số nguyên")
    .min(1, "Số trang phải lớn hơn hoặc bằng 1")
    .default(1),
  pageSize: z.coerce
    .number()
    .int("Kích thước trang phải là số nguyên")
    .min(1, "Kích thước trang phải lớn hơn hoặc bằng 1")
    .max(100, "Kích thước trang tối đa là 100")
    .default(20),
});

export type KanjiListQuery = z.infer<typeof kanjiListQuerySchema>;

export type KanjiListItem = {
  id: number;
  character: string;
  strokeCount: number | null;
  radical: string | null;
  // 1 = N1 (hardest) … 5 = N5 (easiest).
  jlpt: number | null;
  createdAt: string;
};

export type KanjiListResponse = {
  kanji: KanjiListItem[];
  total: number;
  page: number;
  pageSize: number;
};

// Exactly one Han character (also matches radical forms such as 氵).
const singleHanCharacter = /^\p{Script=Han}$/u;

// Shared by the add form (US-22) and the API; optional fields use null when empty.
export const kanjiInputSchema = z.object({
  character: z
    .string({ error: "Vui lòng nhập chữ Kanji" })
    .trim()
    .min(1, "Vui lòng nhập chữ Kanji")
    .regex(singleHanCharacter, "Chữ Kanji phải là đúng 1 chữ Hán"),
  jlpt: z
    .number({ error: "Vui lòng chọn cấp độ JLPT" })
    .int("Cấp độ JLPT không hợp lệ")
    .min(1, "Cấp độ JLPT không hợp lệ")
    .max(5, "Cấp độ JLPT không hợp lệ"),
  strokeCount: z
    .number({ error: "Số nét phải là số" })
    .int("Số nét phải là số nguyên")
    .min(1, "Số nét phải từ 1 đến 84")
    .max(84, "Số nét phải từ 1 đến 84")
    .nullable()
    .optional(),
  radical: z
    .string({ error: "Bộ thủ không hợp lệ" })
    .trim()
    .regex(singleHanCharacter, "Bộ thủ phải là đúng 1 chữ Hán")
    .nullable()
    .optional(),
});

export type KanjiInput = z.input<typeof kanjiInputSchema>;

export type KanjiResponse = {
  kanji: KanjiListItem;
};
