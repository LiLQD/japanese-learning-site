
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const { user, isLoading } = useAuth();

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
