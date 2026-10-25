import Navbar from "../../../components/Navbar";
import "./UserListPage.css";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { UserListResponse } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import { fetchUsers, updateUserStatus, deleteUser } from "../api";
import UserTable from "../components/UserTable";

const PAGE_SIZE = 20;

function UserListPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const requestKey = `${page}`;
  const isLoading = loadedKey !== requestKey;

  async function handleUpdateStatus(id: number, status: "ACTIVE" | "LOCKED") {
    const action = status === "LOCKED" ? "khóa" : "mở khóa";

    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) {
      return;
    }

    setUpdatingUserId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await updateUserStatus(id, status);

      const result = await fetchUsers(page, PAGE_SIZE);
      setData(result);
      setLoadedKey(requestKey);
      setStatusMessage("Cập nhật trạng thái tài khoản thành công.");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái tài khoản.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(id: number) {
    setDeletingUserId(id);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await deleteUser(id);

      const result = await fetchUsers(page, PAGE_SIZE);

      if (result.users.length === 0 && page > 1) {
        setPage((currentPage) => currentPage - 1);
        setStatusMessage("Xóa tài khoản thành công.");
        return;
      }

      setData(result);
      setLoadedKey(requestKey);
      setStatusMessage("Xóa tài khoản thành công.");
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể xóa tài khoản người dùng.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    fetchUsers(page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;

        setData(result);
        setErrorMessage("");
        setLoadedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách người dùng.",
        );
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, page, requestKey]);

  if (isAuthLoading) {
    return (
      <main>
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </main>
    );
  }

  if (!user) {
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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="admin-layout">
      <Navbar />

      <main className="admin-main">
        <div className="admin-page-header">
          <div>
            <p className="admin-eyebrow">YUME · QUẢN TRỊ</p>
            <h1>Quản lý người dùng</h1>
            <p className="admin-description">
              Theo dõi và quản lý tài khoản thành viên trên Yume.
            </p>
          </div>

          <div className="admin-total-card">
            <span>Tổng số tài khoản</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
        </div>

        {data && <p>Tổng số: {data.total} người dùng</p>}

        {errorMessage && <p role="alert">{errorMessage}</p>}
        {statusMessage && <p role="status">{statusMessage}</p>}

        {isLoading && !data ? (
          <p>Đang tải danh sách...</p>
        ) : (
          data && (
            <UserTable
              users={data.users}
              emptyMessage="Chưa có người dùng nào."
              onUpdateStatus={handleUpdateStatus}
              updatingUserId={updatingUserId}
              onDelete={handleDeleteUser}
              deletingUserId={deletingUserId}
            />
          )
        )}

        <nav>
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || isLoading}
          >
            Trang trước
          </button>

          <span>
            Trang {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Trang sau
          </button>
        </nav>
      </main>
    </div>
  );
}

export default UserListPage;
