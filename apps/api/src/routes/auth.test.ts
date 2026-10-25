import express from "express";
import request from "supertest";
import { compare } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  createMock,
  verificationTokenCreateMock,
  sendVerificationEmailMock,
  verificationTokenFindFirstMock,
  verificationTokenUpdateManyMock,
  userUpdateMock,
  transactionMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  verificationTokenCreateMock: vi.fn(),
  sendVerificationEmailMock: vi.fn(),
  verificationTokenFindFirstMock: vi.fn(),
  verificationTokenUpdateManyMock: vi.fn(),
  userUpdateMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("../modules/notifications/notifications.service.js", () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
      update: userUpdateMock,
    },
    verificationToken: {
      create: verificationTokenCreateMock,
      findFirst: verificationTokenFindFirstMock,
      updateMany: verificationTokenUpdateManyMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("../lib/email.js", () => ({
  sendVerificationEmail: sendVerificationEmailMock,
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
      await compare(validBody.password, createArgs.data.passwordHash),
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

describe("POST /api/auth/verification/request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockResolvedValue({
      id: 10,
      emailVerifiedAt: null,
    });
    verificationTokenCreateMock.mockResolvedValue({ id: 1 });
    sendVerificationEmailMock.mockResolvedValue(undefined);
  });

  it("creates a hashed token and sends a verification email", async () => {
    const res = await request(makeApp())
      .post("/api/auth/verification/request")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(202);
    expect(verificationTokenCreateMock).toHaveBeenCalledOnce();
    expect(sendVerificationEmailMock).toHaveBeenCalledOnce();

    const tokenArgs = verificationTokenCreateMock.mock.calls[0][0];
    expect(tokenArgs.data.type).toBe("EMAIL_VERIFY");
    expect(tokenArgs.data.userId).toBe(10);
    expect(tokenArgs.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    const [sentEmail, sentToken] = sendVerificationEmailMock.mock.calls[0];
    expect(sentEmail).toBe("test@example.com");
    expect(sentToken).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenArgs.data.tokenHash).not.toBe(sentToken);
  });

  it("returns a generic response when the email does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const res = await request(makeApp())
      .post("/api/auth/verification/request")
      .send({ email: "unknown@example.com" });

    expect(res.status).toBe(202);
    expect(res.body.message).toContain("Nếu tài khoản tồn tại");
    expect(verificationTokenCreateMock).not.toHaveBeenCalled();
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("does not send another email when the account is verified", async () => {
    findUniqueMock.mockResolvedValue({
      id: 10,
      emailVerifiedAt: new Date(),
    });

    const res = await request(makeApp())
      .post("/api/auth/verification/request")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(202);
    expect(verificationTokenCreateMock).not.toHaveBeenCalled();
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    const res = await request(makeApp())
      .post("/api/auth/verification/request")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(verificationTokenCreateMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/verification/confirm", () => {
  const rawToken = "a".repeat(64);

  beforeEach(() => {
    vi.clearAllMocks();

    verificationTokenFindFirstMock.mockResolvedValue({
      id: 20,
      userId: 10,
    });

    verificationTokenUpdateManyMock.mockResolvedValue({
      count: 1,
    });

    userUpdateMock.mockResolvedValue({
      id: 10,
      emailVerifiedAt: new Date(),
    });

    transactionMock.mockImplementation(async (callback) =>
      callback({
        verificationToken: {
          updateMany: verificationTokenUpdateManyMock,
        },
        user: {
          update: userUpdateMock,
        },
      }),
    );
  });

  it("confirms email with a valid token", async () => {
    const res = await request(makeApp())
      .post("/api/auth/verification/confirm")
      .send({ token: rawToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Xác minh email thành công.");

    expect(verificationTokenFindFirstMock).toHaveBeenCalledOnce();

    const findArgs = verificationTokenFindFirstMock.mock.calls[0][0];
    expect(findArgs.where.type).toBe("EMAIL_VERIFY");
    expect(findArgs.where.usedAt).toBeNull();
    expect(findArgs.where.expiresAt.gt).toBeInstanceOf(Date);
    expect(findArgs.where.tokenHash).not.toBe(rawToken);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(verificationTokenUpdateManyMock).toHaveBeenCalledOnce();
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        emailVerifiedAt: expect.any(Date),
      },
    });
  });

  it("rejects an invalid or expired token", async () => {
    verificationTokenFindFirstMock.mockResolvedValue(null);

    const res = await request(makeApp())
      .post("/api/auth/verification/confirm")
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(verificationTokenUpdateManyMock).not.toHaveBeenCalled();
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a token that has already been used", async () => {
    verificationTokenUpdateManyMock.mockResolvedValue({
      count: 0,
    });

    const res = await request(makeApp())
      .post("/api/auth/verification/confirm")
      .send({ token: rawToken });

    expect(res.status).toBe(400);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const res = await request(makeApp())
      .post("/api/auth/verification/confirm")
      .send({});

    expect(res.status).toBe(400);
    expect(verificationTokenFindFirstMock).not.toHaveBeenCalled();
  });
});
