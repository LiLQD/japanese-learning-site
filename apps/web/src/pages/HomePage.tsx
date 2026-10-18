import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/auth-context";

function HomePage() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");

    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Chào mừng đến với Japanese Learning</h1>
      <p>Học tiếng Nhật theo cách của bạn.</p>

      {user ? (
        <section>
          <h2>Xin chào, {user.displayName}!</h2>
          <p>Email: {user.email}</p>
          <p>Vai trò: {user.role}</p>

          {error && <p role="alert">{error}</p>}

          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </section>
      ) : (
        <p>
          <Link to="/register">Đăng ký tài khoản</Link>
          {" | "}
          <Link to="/login">Đăng nhập</Link>
        </p>
      )}
    </main>
  );
}

export default HomePage;
