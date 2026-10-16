
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import "./VerifyEmailPage.css";

type VerificationResult = {
  success: boolean;
  message: string;
};

// Dùng chung yêu cầu API nếu React chạy effect nhiều lần
const verificationRequests = new Map<
  string,
  Promise<VerificationResult>
>();

function verifyToken(token: string): Promise<VerificationResult> {
  const existingRequest = verificationRequests.get(token);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async (): Promise<VerificationResult> => {
    const response = await fetch(
      "/api/auth/verification/confirm",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message:
          typeof data.message === "string"
            ? data.message
            : "Xác minh thất bại. Liên kết có thể đã hết hạn.",
      };
    }

    return {
      success: true,
      message:
        typeof data.message === "string"
          ? data.message
          : "Xác minh email thành công!",
    };
  })();

  verificationRequests.set(token, request);

  return request;
}

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "Đang xác minh email của bạn...",
  );

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Liên kết xác minh không hợp lệ vì thiếu token.");
      return;
    }

    let active = true;

    verifyToken(token)
      .then((result) => {
        if (!active) return;

        setStatus(result.success ? "success" : "error");
        setMessage(result.message);
      })
      .catch(() => {
        if (!active) return;

        setStatus("error");
        setMessage("Không thể kết nối đến máy chủ.");
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="verify-email-page">
      <section className="verify-email-card">
        <h1>YUME</h1>

        <h2>
          {status === "loading"
            ? "Đang xác minh"
            : status === "success"
              ? "Xác minh thành công"
              : "Xác minh thất bại"}
        </h2>

        <p role="status">{message}</p>

        {status !== "loading" && (
          <Link className="verify-email-link" to="/login">
            Đến trang đăng nhập
          </Link>
        )}
      </section>
    </main>
  );
}

export default VerifyEmailPage;
