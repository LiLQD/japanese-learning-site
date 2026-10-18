import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";

export async function listNotifications(userId: number) {
  const [notifications, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationAsRead(id: number, userId: number) {
  return prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function createNotification(
  userId: number,
  type: string,
  payload: Prisma.InputJsonValue = {},
) {
  return prisma.notification.create({
    data: { userId, type, payload },
  });
}
