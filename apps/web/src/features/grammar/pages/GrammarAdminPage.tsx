import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { GrammarListResponse } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import { fetchAdminGrammarList, GRAMMAR_PAGE_SIZE } from "../api";
import GrammarAdminTable from "../components/GrammarAdminTable";
import "./GrammarAdminPage.css";

function GrammarAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [data, setData] = useState<GrammarListResponse | null>(null);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoading = loadedPage !== page;

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    fetchAdminGrammarList(page, GRAMMAR_PAGE_SIZE)
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
            : "Không thể tải danh sách ngữ pháp.",
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

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / GRAMMAR_PAGE_SIZE))
    : 1;

  return (
    <div className="grammar-admin-layout">
      <Navbar />
      <main className="grammar-admin-main">
        <header className="grammar-admin-header">
          <div>
            <p className="grammar-admin-eyebrow">YUME · QUẢN TRỊ</p>
            <h1>Quản lý ngữ pháp</h1>
            <p>Danh sách dữ liệu ngữ pháp trong hệ thống.</p>
          </div>
          <div className="grammar-admin-total">
            <span>Tổng số ngữ pháp</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
        </header>

        {errorMessage && <p role="alert">{errorMessage}</p>}
        {isLoading && !data ? (
          <p role="status">Đang tải danh sách...</p>
        ) : (
          data && (
            <GrammarAdminTable
              grammars={data.grammars}
              page={page}
              pageSize={GRAMMAR_PAGE_SIZE}
            />
          )
        )}

        {data && data.total > 0 && (
          <nav className="grammar-admin-pagination" aria-label="Phân trang">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1 || isLoading}
            >
              Trang trước
            </button>
            <span>
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Trang sau
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

export default GrammarAdminPage;
