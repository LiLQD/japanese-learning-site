import { z } from "zod";

export const userListQuerySchema = z.object({
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
  // Search by email or display name; an empty string means no filter.
  q: z
    .string()
    .trim()
    .max(100, "Từ khóa tìm kiếm tối đa 100 ký tự")
    .optional()
    .transform((value) => value || undefined),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

export type UserListItem = {
  id: number;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "LOCKED";
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type UserListResponse = {
  users: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const userIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: "Mã người dùng không hợp lệ" })
    .int("Mã người dùng không hợp lệ")
    .positive("Mã người dùng không hợp lệ"),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;

export type UserDetail = UserListItem & {
  updatedAt: string;
};

export type UserDetailResponse = {
  user: UserDetail;
};
