import { Link, Outlet } from "react-router";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";

export default function WordAuthGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="words-access-message">
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <div className="words-layout">
        <Navbar />
        <main className="words-access-message">
          <h1>Đăng nhập để tra cứu từ vựng</h1>
          <p>Vui lòng đăng nhập để sử dụng từ điển tiếng Nhật.</p>
          <Link to="/login" className="words-primary-button">
            Đăng nhập
          </Link>
        </main>
      </div>
    );
  }

  return <Outlet />;
}
