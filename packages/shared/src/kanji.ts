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
