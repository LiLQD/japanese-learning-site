import type { UserListQuery } from "@app/shared";
import { prisma } from "../../lib/prisma.js";

// Never select passwordHash: these fields are sent to the admin UI.
const userListSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export async function listUsers({ page, pageSize, q }: UserListQuery) {
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { displayName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { ...userListSelect, updatedAt: true },
  });
}
export async function updateUserStatus(
  id: number,
  status: "ACTIVE" | "LOCKED",
) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id },
      data: { status },
    });

    if (result.count === 0) {
      return null;
    }

    // Khi khóa tài khoản, vô hiệu hóa các phiên đăng nhập hiện có.
    if (status === "LOCKED") {
      await tx.session.deleteMany({
        where: { userId: id },
      });
    }

    return tx.user.findUnique({
      where: { id },
      select: { ...userListSelect, updatedAt: true },
    });
  });
}
export async function deleteUser(id: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      return null;
    }

    if (user.role === "ADMIN") {
      return false;
    }

    await tx.user.delete({
      where: { id },
    });

    return true;
  });
}