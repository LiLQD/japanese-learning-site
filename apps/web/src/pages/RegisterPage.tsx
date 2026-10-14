
import { useState } from "react";
import "./RegisterPage.css";

function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Xóa thông báo cũ
    setError("");
    setSuccess("");

    // Kiểm tra họ tên
    if (!displayName.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

   
const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

if (!emailPattern.test(email.trim())) {
  setError("Vui lòng nhập email hợp lệ, ví dụ abc@gmail.com.");
  return;
}


    // Kiểm tra độ dài mật khẩu
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // Hiện tại mới kiểm tra dữ liệu trên giao diện
    setSuccess("Thông tin hợp lệ! Có thể tiếp tục đăng ký.");
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
            <label htmlFor="confirmPassword">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
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
