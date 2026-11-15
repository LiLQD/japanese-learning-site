import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { NotificationItem, NotificationListResponse } from "@app/shared";
import { useAuth } from "../contexts/auth-context";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const isAdmin = user?.role === "ADMIN";
  const isKanjiPage = pathname.startsWith("/kanji");
  const isWordsPage = pathname.startsWith("/words");
  const isReadingPage = pathname.startsWith("/reading");
  const isGrammarPage = isAdmin
    ? pathname.startsWith("/admin/grammar")
    : pathname.startsWith("/grammar");

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    void navigate("/login");
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data: NotificationListResponse = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Lỗi tải thông báo", error);
      }
    };

    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, readAt: new Date().toISOString() }
          : notification,
      ),
    );
    setUnreadCount((previous) => Math.max(0, previous - 1));
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          <img src="/logo.png" alt="YUME Logo" className="brand-logo" />
          <span className="brand-text">YUME</span>
        </Link>

        <button
          type="button"
          className="nav-mobile-toggle"
          aria-label={
            isMobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"
          }
          aria-controls="primary-navigation"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{isMobileMenuOpen ? "×" : "☰"}</span>
        </button>

        <div
          className={`nav-center ${isMobileMenuOpen ? "nav-center-open" : ""}`}
        >
          <nav
            id="primary-navigation"
            className="nav-links"
            aria-label="Điều hướng chính"
          >
            <Link to="/" onClick={closeMobileMenu}>
              Trang chủ
            </Link>
            <Link
              to="/words"
              className={isWordsPage ? "active" : ""}
              onClick={closeMobileMenu}
            >
              Từ vựng
            </Link>
            <Link
              to={isAdmin ? "/admin/grammar" : "/grammar"}
              className={isGrammarPage ? "active" : ""}
              onClick={closeMobileMenu}
            >
              Ngữ pháp
            </Link>
            <Link
              to="/kanji"
              className={isKanjiPage ? "active" : ""}
              onClick={closeMobileMenu}
            >
              Hán tự
            </Link>
            <Link
              to="/reading"
              className={isReadingPage ? "active" : ""}
              onClick={closeMobileMenu}
            >
              Bài đọc
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/dashboard" onClick={closeMobileMenu}>
                  Dashboard
                </Link>
                <Link to="/admin/users" onClick={closeMobileMenu}>
                  Quản lý người dùng
                </Link>
              </>
            )}
          </nav>
          <input
            type="search"
            className="nav-search"
            placeholder="Tìm từ vựng, hán tự, ngữ pháp..."
            aria-label="Tìm kiếm"
          />
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <div className="admin-menu" ref={adminMenuRef}>
                  <button
                    type="button"
                    className="admin-menu-trigger"
                    aria-haspopup="menu"
                    aria-expanded={isAdminMenuOpen}
                    onClick={() => setIsAdminMenuOpen((open) => !open)}
                  >
                    Quản trị
                    <span className="admin-menu-chevron" aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {isAdminMenuOpen && (
                    <div className="admin-menu-dropdown" role="menu">
                      <Link
                        to="/admin/dashboard"
                        role="menuitem"
                        onClick={() => setIsAdminMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/users"
                        role="menuitem"
                        onClick={() => setIsAdminMenuOpen(false)}
                      >
                        Quản lý người dùng
                      </Link>
                      <Link
                        to="/admin/grammar"
                        role="menuitem"
                        onClick={() => setIsAdminMenuOpen(false)}
                      >
                        Quản lý ngữ pháp
                      </Link>
                      <Link to="/reading">Quản lý Bài đọc</Link>
                    </div>
                  )}
                </div>
              )}

              <Link
                to="/profile"
                className={`nav-user ${isAdmin ? "nav-user-admin" : ""}`}
              >
                {user.avatarKey ? (
                  <img
                    src={`/uploads/${user.avatarKey}`}
                    alt="Avatar"
                    className="nav-avatar"
                  />
                ) : (
                  <span
                    className="nav-avatar nav-avatar-fallback"
                    aria-hidden="true"
                  >
                    {user.displayName[0]}
                  </span>
                )}
                <span>{isAdmin ? "Tài khoản" : user.displayName}</span>
              </Link>

              <div className="notification-wrapper" ref={notificationRef}>
                <button
                  type="button"
                  className="notification-bell"
                  aria-label="Thông báo"
                  aria-expanded={isNotificationsOpen}
                  onClick={() => setIsNotificationsOpen((open) => !open)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">Thông báo</div>
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        Không có thông báo nào.
                      </div>
                    ) : (
                      <ul className="notification-list">
                        {notifications.map((notification) => (
                          <li
                            key={notification.id}
                            className={`notification-item ${!notification.readAt ? "unread" : ""}`}
                            onClick={() =>
                              !notification.readAt &&
                              handleRead(notification.id)
                            }
                          >
                            <p>
                              {notification.payload?.message ||
                                "Bạn có thông báo mới."}
                            </p>
                            <span className="notification-time">
                              {new Date(notification.createdAt).toLocaleString(
                                "vi-VN",
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

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
