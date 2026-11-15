import { z } from "zod";

export const GRAMMAR_KEYWORD_MAX_LENGTH = 100;

export const grammarListQuerySchema = z.object({
  // Matches title, pattern or meaning (case-insensitive). Empty = no filter.
  keyword: z
    .string()
    .trim()
    .max(GRAMMAR_KEYWORD_MAX_LENGTH, "Từ khóa tối đa 100 ký tự")
    .optional(),
  jlpt: z.coerce
    .number()
    .int("Cấp độ JLPT không hợp lệ")
    .min(1, "Cấp độ JLPT không hợp lệ")
    .max(5, "Cấp độ JLPT không hợp lệ")
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

// Validates the :id route param of /api/grammar/:id.
export const grammarIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "ID ngữ pháp không hợp lệ" })
    .int("ID ngữ pháp không hợp lệ")
    .positive("ID ngữ pháp không hợp lệ"),
});

export type GrammarDetailResponse = {
  grammar: GrammarListItem;
};

export const grammarExampleInputSchema = z.object({
  japanese: z.string().trim().min(1, "Vui lòng nhập câu tiếng Nhật"),
  reading: z.string().trim().optional().nullable(), // <--- Đã thêm trường reading
  vietnamese: z.string().trim().min(1, "Vui lòng nhập bản dịch tiếng Việt"),
});

export const grammarCreateInputSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên ngữ pháp"),
  pattern: z.string().trim().min(1, "Vui lòng nhập cấu trúc ngữ pháp"),
  meaning: z.string().trim().min(1, "Vui lòng nhập ý nghĩa"),
  jlpt: z.number().int("Cấp độ JLPT không hợp lệ").min(1).max(5),
  examples: z.array(grammarExampleInputSchema).default([]),
});

export type GrammarCreateInput = z.input<typeof grammarCreateInputSchema>;

export type GrammarCreateResponse = {
  grammar: GrammarListItem;
};

export const grammarUpdateExampleInputSchema = grammarExampleInputSchema.extend(
  {
    id: z.number().int().positive().optional(),
  },
);

export const grammarUpdateInputSchema = z
  .object({
    title: z.string().trim().min(1, "Vui lòng nhập tên ngữ pháp").optional(),
    pattern: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập cấu trúc ngữ pháp")
      .optional(),
    meaning: z.string().trim().min(1, "Vui lòng nhập ý nghĩa").optional(),
    jlpt: z
      .number()
      .int("Cấp độ JLPT không hợp lệ")
      .min(1)
      .max(5)
      .nullable()
      .optional(),
    examples: z.array(grammarUpdateExampleInputSchema).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "Cần cung cấp ít nhất một trường để cập nhật",
  })
  .superRefine((input, context) => {
    const ids = (input.examples ?? [])
      .map((example) => example.id)
      .filter((id): id is number => id !== undefined);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["examples"],
        message: "Ví dụ bị trùng mã",
      });
    }
  });

export type GrammarUpdateInput = z.input<typeof grammarUpdateInputSchema>;

export type GrammarAdminExample = {
  id: number;
  japanese: string;
  reading: string | null;
  vietnamese: string;
  position: number;
};

export type GrammarAdminDetail = GrammarListItem & {
  examples: GrammarAdminExample[];
};

export type GrammarAdminDetailResponse = {
  grammar: GrammarAdminDetail;
};
