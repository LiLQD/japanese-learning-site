import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { UserListResponse } from "@app/shared";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchUsers } from "../api";
import UserTable from "../components/UserTable";

const PAGE_SIZE = 20;

function UserListPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListResponse | null>(null);
  // Page whose request has finished (success or error); loading until it matches.
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoading = loadedPage !== page;

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    fetchUsers(page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setErrorMessage("");
        setLoadedPage(page);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách người dùng.",
        );
        setLoadedPage(page);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, page]);

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
    <main>
      <h1>Quản lý người dùng</h1>

      {data && <p>Tổng số: {data.total} người dùng</p>}

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {isLoading && !data ? (
        <p>Đang tải danh sách...</p>
      ) : (
        data && <UserTable users={data.users} />
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
  );
}

export default UserListPage;
