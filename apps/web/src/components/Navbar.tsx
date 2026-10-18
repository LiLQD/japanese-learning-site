import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/auth-context";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-brand">
          <span className="brand-icon">学</span>
          <span className="brand-text">YUME</span>
        </Link>

        {/* Links & Search */}
        <div className="nav-center">
          <nav className="nav-links">
            <Link to="/">Trang chủ</Link>
            <Link to="/forum">Diễn đàn</Link>
          </nav>

          <div className="nav-search-wrapper">
            <input
              type="text"
              className="nav-search"
              placeholder="Tìm từ vựng, hán tự, ngữ pháp..."
            />
            <div className="nav-tabs">
              <span className="active">Từ vựng</span>
              <span>Hán tự</span>
              <span>Ngữ pháp</span>
              <span>Bài đọc</span>
            </div>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="nav-actions">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link to="/admin/users" className="nav-link-admin">
                  Quản lý
                </Link>
              )}
              <Link
                to="/profile"
                className="nav-user"
                style={{ textDecoration: "none" }}
              >
                Chào, {user.displayName}
              </Link>
              <button onClick={handleLogout} className="btn-outline">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-outline">
                Đăng ký
              </Link>
              <Link to="/login" className="btn-primary">
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
