import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcryptjs";

import { unauthorized } from "../../errors.js";
import { createNotification } from "../notifications/notifications.service.js";
import type { UpdateProfileInput } from "@app/shared";

const profileSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export async function getProfile(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

export async function updateProfile(userId: number, data: UpdateProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data: { displayName: data.displayName },
    select: profileSelect,
  });
}

export async function changePassword(
  userId: number,
  oldPass: string,
  newPass: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw unauthorized("Không tìm thấy người dùng");
  }

  const isValid = await bcrypt.compare(oldPass, user.passwordHash);
  if (!isValid) {
    throw unauthorized("Mật khẩu cũ không chính xác");
  }

  const newHash = await bcrypt.hash(newPass, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Bảo mật: Xóa tất cả các phiên đăng nhập khác (buộc đăng nhập lại)
  await prisma.session.deleteMany({
    where: { userId },
  });

  // Gửi thông báo
  await createNotification(userId, "PASSWORD_CHANGED", {
    message: "Mật khẩu của bạn đã được thay đổi thành công.",
  });
}
