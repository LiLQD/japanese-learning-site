import Navbar from "../../../components/Navbar";
import "./KanjiListPage.css";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { KanjiListResponse } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import { fetchKanjiList, KANJI_PAGE_SIZE as PAGE_SIZE } from "../api";
import KanjiTable from "../components/KanjiTable";

// Sent by the add/edit pages when they navigate back to the list.
export type KanjiListLocationState = {
  message?: string;
  page?: number;
};

// Public page: guests and users can browse; only admins see the write actions.
function KanjiListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as KanjiListLocationState | null;

  const [page, setPage] = useState(locationState?.page ?? 1);
  const [data, setData] = useState<KanjiListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage] = useState(locationState?.message ?? "");

  // Clear the one-time message so it does not reappear on reload.
  useEffect(() => {
    if (location.state) {
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const requestKey = `${page}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    fetchKanjiList(page, PAGE_SIZE)
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
            : "Không thể tải danh sách Kanji.",
        );
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [page, requestKey]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="kanji-layout">
      <Navbar />

      <main className="kanji-main">
        <div className="kanji-page-header">
          <div>
            <p className="kanji-eyebrow">YUME · HÁN TỰ</p>
            <h1>Hán tự</h1>
            <p className="kanji-description">
              Danh sách chữ Kanji theo cấp độ JLPT.
            </p>
          </div>

          <div className="kanji-header-side">
            <div className="kanji-total-card">
              <span>Tổng số chữ Kanji</span>
              <strong>{data?.total ?? 0}</strong>
            </div>

            {isAdmin && (
              <Link to="/kanji/new" className="kanji-button">
                + Thêm mới
              </Link>
            )}
          </div>
        </div>

        {statusMessage && (
          <p className="kanji-status" role="status">
            {statusMessage}
          </p>
        )}
        {errorMessage && <p role="alert">{errorMessage}</p>}

        {isLoading ? (
          <p>Đang tải danh sách...</p>
        ) : (
          data && (
            <KanjiTable kanji={data.kanji} isAdmin={isAdmin} page={page} />
          )
        )}

        {data && data.total > 0 && (
          <nav className="kanji-pagination">
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
        )}
      </main>
    </div>
  );
}

export default KanjiListPage;
