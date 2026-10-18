import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/auth-context";
import type { NotificationListResponse, NotificationItem } from "@app/shared";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Fetch thông báo và tự động cập nhật mỗi 30s
  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data: NotificationListResponse = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Lỗi tải thông báo", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    // Cập nhật state ngay lập tức để UI mượt mà
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">学</span>
          <span className="brand-text">YUME</span>
        </Link>

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
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {user.avatarKey ? (
                  <img
                    src={`/uploads/${user.avatarKey}`}
                    alt="Avatar"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--color-brand)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                    }}
                  >
                    {user.displayName[0]}
                  </div>
                )}
                <span>{user.displayName}</span>
              </Link>

              {/* CHUÔNG THÔNG BÁO */}
              <div className="notification-wrapper" ref={dropdownRef}>
                <button
                  className="notification-bell"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {isOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">Thông báo</div>
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        Không có thông báo nào.
                      </div>
                    ) : (
                      <ul className="notification-list">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className={`notification-item ${!n.readAt ? "unread" : ""}`}
                            onClick={() => !n.readAt && handleRead(n.id)}
                          >
                            <p>
                              {n.payload?.message || "Bạn có thông báo mới."}
                            </p>
                            <span className="notification-time">
                              {new Date(n.createdAt).toLocaleString("vi-VN")}
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
