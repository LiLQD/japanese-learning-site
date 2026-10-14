import { z } from "zod";

export * from "./errors.js";

export const healthResponseSchema = z.object({ status: z.literal("ok") });
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1, "Vui lòng nhập họ tên").max(100),
    email: z.string().trim().email("Email không hợp lệ").max(255),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
