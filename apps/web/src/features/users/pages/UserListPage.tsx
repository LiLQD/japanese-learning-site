import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { UserListResponse } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import { fetchUsers } from "../api";
import UserTable from "../components/UserTable";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

function UserListPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListResponse | null>(null);
  // Request whose response has arrived (success or error); loading until it matches.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const requestKey = `${page}|${search}`;
  const isLoading = loadedKey !== requestKey;

  // Wait until the admin stops typing, then search from the first page.
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = searchInput.trim();
      if (term === search) return;
      setSearch(term);
      setPage(1);
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    fetchUsers(page, PAGE_SIZE, search)
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
  }, [isAdmin, page, search, requestKey]);

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

      <form role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="user-search">Tìm kiếm</label>
        <input
          id="user-search"
          type="search"
          placeholder="Nhập email hoặc họ tên"
          maxLength={100}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </form>

      {data && (
        <p>
          {search
            ? `Tìm thấy ${data.total} người dùng cho "${search}"`
            : `Tổng số: ${data.total} người dùng`}
        </p>
      )}

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {isLoading && !data ? (
        <p>Đang tải danh sách...</p>
      ) : (
        data && (
          <UserTable
            users={data.users}
            emptyMessage={
              search
                ? "Không tìm thấy người dùng phù hợp."
                : "Chưa có người dùng nào."
            }
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
  );
}

export default UserListPage;
