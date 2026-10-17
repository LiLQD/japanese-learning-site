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
