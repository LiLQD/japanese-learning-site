import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../types.js";

const { findManyMock, countMock, transactionMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: {
      findMany: findManyMock,
      count: countMock,
    },
    $transaction: transactionMock,
  },
}));

import usersRouter from "./users.routes.js";
import { errorHandler, notFoundHandler } from "../../middleware/error.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use("/api/admin/users", usersRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const admin: AuthUser = { id: 1, role: "ADMIN" };

const sampleUsers = [
  {
    id: 2,
    email: "learner@example.com",
    displayName: "Learner",
    role: "USER",
    status: "ACTIVE",
    emailVerifiedAt: null,
    createdAt: new Date("2026-10-10T00:00:00.000Z"),
  },
];

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findManyMock.mockResolvedValue(sampleUsers);
    countMock.mockResolvedValue(21);
    transactionMock.mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(makeApp()).get("/api/admin/users");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin user", async () => {
    const res = await request(makeApp({ id: 2, role: "USER" })).get(
      "/api/admin/users",
    );

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns the first page with default page size", async () => {
    const res = await request(makeApp(admin)).get("/api/admin/users");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      users: [
        {
          ...sampleUsers[0],
          createdAt: "2026-10-10T00:00:00.000Z",
        },
      ],
      total: 21,
      page: 1,
      pageSize: 20,
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it("never selects passwordHash", async () => {
    await request(makeApp(admin)).get("/api/admin/users");

    const { select } = findManyMock.mock.calls[0][0];
    expect(select).not.toHaveProperty("passwordHash");
  });

  it("applies page and pageSize from the query", async () => {
    const res = await request(makeApp(admin)).get(
      "/api/admin/users?page=3&pageSize=5",
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 3, pageSize: 5 });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });

  it("filters by email or display name when q is given", async () => {
    const res = await request(makeApp(admin)).get(
      "/api/admin/users?q=%20Learner%20",
    );

    const expectedWhere = {
      OR: [
        { email: { contains: "Learner", mode: "insensitive" } },
        { displayName: { contains: "Learner", mode: "insensitive" } },
      ],
    };
    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(countMock).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it("does not filter when q is empty", async () => {
    const res = await request(makeApp(admin)).get("/api/admin/users?q=%20");

    expect(res.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(countMock).toHaveBeenCalledWith({ where: {} });
  });

  it.each([
    "page=0",
    "page=abc",
    "pageSize=101",
    "pageSize=0",
    `q=${"a".repeat(101)}`,
  ])("returns 400 for invalid query %s", async (query) => {
    const res = await request(makeApp(admin)).get(`/api/admin/users?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
