import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Tên hiển thị không được để trống")
    .max(50, "Tên hiển thị tối đa 50 ký tự"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type ProfileResponse = {
  id: number;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "LOCKED";
  createdAt: string;
};
