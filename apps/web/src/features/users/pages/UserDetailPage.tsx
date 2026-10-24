import { useEffect, useState } from "react";
import "./UserDetailPage.css";
import { Link, useParams } from "react-router";
import type { UserDetail } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import { fetchUser } from "../api";

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

function UserDetailPage() {
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const { id = "" } = useParams();

  const [detail, setDetail] = useState<UserDetail | null>(null);
  // Id whose response has arrived (success or error); loading until it matches.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoading = loadedId !== id;

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    fetchUser(Number(id))
      .then((result) => {
        if (cancelled) return;
        setDetail(result as unknown as UserDetail);
        setErrorMessage("");
        setLoadedId(id);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin người dùng.",
        );
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, id]);

  if (isAuthLoading) {
    return (
      <main>
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main>
        <p>
          Vui lòng <Link to="/login">đăng nhập</Link> để tiếp tục.
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main>
        <p>Bạn không có quyền truy cập trang này.</p>
        <Link to="/">Về trang chủ</Link>
      </main>
    );
  }

  return (
    <main className="user-detail-page">
      <Link className="user-detail-back" to="/admin/users">
        ← Quay lại danh sách
      </Link>

      <header className="user-detail-header">
        <div>
          <p className="user-detail-eyebrow">YUME · QUẢN TRỊ</p>
          <h1>Chi tiết người dùng</h1>
          <p className="user-detail-subtitle">
            Thông tin tài khoản và trạng thái thành viên.
          </p>
        </div>
      </header>

      {isLoading ? (
        <p className="user-detail-message">Đang tải thông tin...</p>
      ) : errorMessage ? (
        <p className="user-detail-message" role="alert">
          {errorMessage}
        </p>
      ) : detail ? (
        <section className="user-detail-card">
          <div className="user-detail-profile">
            <div className="user-detail-avatar">
              {(detail.displayName || detail.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2>{detail.displayName || "Chưa cập nhật họ tên"}</h2>
              <p>{detail.email}</p>
              <span
                className={`user-detail-status ${detail.status === "ACTIVE" ? "active" : "locked"}`}
              >
                {detail.status === "ACTIVE" ? "Đang hoạt động" : "Đã khóa"}
              </span>
            </div>
          </div>

          <dl className="user-detail-grid">
            <div className="user-detail-field">
              <dt>Mã người dùng</dt>
              <dd>{detail.id}</dd>
            </div>
            <div className="user-detail-field">
              <dt>Vai trò</dt>
              <dd>
                {detail.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
              </dd>
            </div>
            <div className="user-detail-field">
              <dt>Xác minh email</dt>
              <dd>
                {detail.emailVerifiedAt
                  ? `Đã xác minh (${formatDateTime(detail.emailVerifiedAt)})`
                  : "Chưa xác minh"}
              </dd>
            </div>
            <div className="user-detail-field">
              <dt>Ngày tạo tài khoản</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
            </div>
            <div className="user-detail-field">
              <dt>Cập nhật lần cuối</dt>
              <dd>{formatDateTime(detail.updatedAt)}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="user-detail-message">Không có dữ liệu người dùng.</p>
      )}
    </main>
  );
}

export default UserDetailPage;
