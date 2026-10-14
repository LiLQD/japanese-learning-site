
import express from "express";
import request from "supertest";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

import authRouter from "./auth.js";
import { errorHandler, notFoundHandler } from "../middleware/error.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue(null);
    createMock.mockImplementation(async ({ data }) => ({
  id: 1,
  displayName: data.displayName,
  email: data.email,
  role: "USER",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
}));
  });

  const validBody = {
    displayName: "Test User",
    email: "test@example.com",
    password: "Test12345",
    confirmPassword: "Test12345",
  };

  it("registers successfully and returns 201", async () => {
    const res = await request(makeApp())
      .post("/api/auth/register")
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Đăng ký thành công");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(findUniqueMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledOnce();

    const createArgs = createMock.mock.calls[0][0];
    expect(createArgs.data.passwordHash).not.toBe(validBody.password);
    expect(
      await bcrypt.compare(
        validBody.password,
        createArgs.data.passwordHash,
      ),
    ).toBe(true);
  });

  it("returns 409 when email already exists", async () => {
    findUniqueMock.mockResolvedValue({ id: 2, email: validBody.email });

    const res = await request(makeApp())
      .post("/api/auth/register")
      .send(validBody);

    expect(res.status).toBe(409);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const res = await request(makeApp())
      .post("/api/auth/register")
      .send({ ...validBody, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(makeApp())
      .post("/api/auth/register")
      .send({
        ...validBody,
        password: "123",
        confirmPassword: "123",
      });

    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 when passwords do not match", async () => {
    const res = await request(makeApp())
      .post("/api/auth/register")
      .send({
        ...validBody,
        confirmPassword: "Different123",
      });

    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
