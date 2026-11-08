
import { z } from "zod";

export const kanjiListQuerySchema = z.object({
  keyword: z
    .string()
    .trim()
    .max(100, "Từ khóa tối đa 100 ký tự")
    .optional(),
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

// Validates the :id route param of /api/kanji/:id.
export const kanjiIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "ID Kanji không hợp lệ" })
    .int("ID Kanji không hợp lệ")
    .positive("ID Kanji không hợp lệ"),
});

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

// Shared by the add/edit forms (US-22, US-23) and the API; optional fields use null when empty.
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
    .string()
    .trim()
    .min(1, "Vui lòng nhập bộ thủ")
    .max(10, "Bộ thủ tối đa 10 ký tự")
    .regex(/^\p{Script=Han}+$/u, "Bộ thủ phải là chữ Hán tự"),
});

export type KanjiInput = z.input<typeof kanjiInputSchema>;

export type KanjiResponse = {
  kanji: KanjiListItem;
};
