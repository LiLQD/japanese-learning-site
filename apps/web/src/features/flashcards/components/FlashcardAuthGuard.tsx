import { Link, Outlet } from "react-router";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import "./../pages/FlashcardDeckListPage.css";

export default function FlashcardAuthGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flashcard-main" role="status">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );
  }

  if (!user) {
    return (
      <div className="flashcard-layout">
        <Navbar />
        <main className="flashcard-main">
          <h1>Đăng nhập để xem bộ flashcard</h1>
          <p>Vui lòng đăng nhập để truy cập các bộ flashcard của bạn.</p>
          <Link to="/login" className="btn-primary">
            Đăng nhập
          </Link>
        </main>
      </div>
    );
  }

  return <Outlet />;
}
