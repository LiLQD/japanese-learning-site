import { z } from "zod";

export const grammarListQuerySchema = z.object({
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

export type GrammarListQuery = z.infer<typeof grammarListQuerySchema>;

export type GrammarListItem = {
  id: number;
  title: string;
  pattern: string;
  meaning: string;
  // 1 = N1 (hardest) … 5 = N5 (easiest).
  jlpt: number | null;
};

export type GrammarListResponse = {
  grammars: GrammarListItem[];
  total: number;
  page: number;
  pageSize: number;
};
