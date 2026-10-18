import { prisma } from "../../lib/prisma.js";
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
