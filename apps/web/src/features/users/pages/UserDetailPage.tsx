import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { UserDetail } from "@app/shared";
import { useAuth } from "../../../contexts/AuthContext";
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
        setDetail(result.user);
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
    <main>
      <Link to="/admin/users">← Quay lại danh sách</Link>
      <h1>Chi tiết người dùng</h1>

      {isLoading ? (
        <p>Đang tải thông tin...</p>
      ) : errorMessage ? (
        <p role="alert">{errorMessage}</p>
      ) : (
        detail && (
          <dl>
            <dt>ID</dt>
            <dd>{detail.id}</dd>
            <dt>Email</dt>
            <dd>{detail.email}</dd>
            <dt>Họ tên</dt>
            <dd>{detail.displayName}</dd>
            <dt>Vai trò</dt>
            <dd>{detail.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}</dd>
            <dt>Trạng thái</dt>
            <dd>{detail.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</dd>
            <dt>Xác minh email</dt>
            <dd>
              {detail.emailVerifiedAt
                ? `Đã xác minh (${formatDateTime(detail.emailVerifiedAt)})`
                : "Chưa xác minh"}
            </dd>
            <dt>Ngày tạo</dt>
            <dd>{formatDateTime(detail.createdAt)}</dd>
            <dt>Cập nhật lần cuối</dt>
            <dd>{formatDateTime(detail.updatedAt)}</dd>
          </dl>
        )
      )}
    </main>
  );
}

export default UserDetailPage;
