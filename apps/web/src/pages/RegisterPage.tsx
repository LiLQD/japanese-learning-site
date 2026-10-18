import { useState } from "react";
import "./RegisterPage.css";

function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!displayName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: normalizedEmail,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.message === "string"
            ? data.message
            : typeof data.error === "string"
              ? data.error
              : "Đăng ký thất bại. Vui lòng thử lại.";

        throw new Error(message);
      }

      const verificationResponse = await fetch(
        "/api/auth/verification/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      if (!verificationResponse.ok) {
        throw new Error(
          "Tài khoản đã được tạo, nhưng chưa gửi được yêu cầu xác minh email. Vui lòng thử gửi lại sau.",
        );
      }

      setSuccess(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản. Nếu chưa thấy thư, hãy kiểm tra cả mục Spam.",
      );

      setDisplayName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể kết nối đến máy chủ.",
      );
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>YUME</h1>
        <h2>Tạo tài khoản</h2>
        <p>Đăng ký để bắt đầu hành trình học tiếng Nhật!</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Họ và tên</label>
            <input
              id="displayName"
              type="text"
              placeholder="Nhập họ và tên"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="form-message error-message" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="form-message success-message" role="status">
              {success}
            </p>
          )}

          <button type="submit" className="register-button">
            Đăng ký
          </button>
        </form>

        <p className="login-link">
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
