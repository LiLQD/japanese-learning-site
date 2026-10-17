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

export async function listUsers({ page, pageSize }: UserListQuery) {
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      select: userListSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);

  return { users, total, page, pageSize };
}
