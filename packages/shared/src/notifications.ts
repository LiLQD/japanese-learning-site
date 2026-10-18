import { z } from "zod";

export const notificationSchema = z.object({
  id: z.number(),
  type: z.string(),
  payload: z.any(), // JSON linh hoạt cho nội dung
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export type NotificationItem = z.infer<typeof notificationSchema>;

export const notificationListResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
});

export type NotificationListResponse = z.infer<
  typeof notificationListResponseSchema
>;
