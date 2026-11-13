import Navbar from "../../../components/Navbar";
import "./GrammarListPage.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import type { GrammarListResponse } from "@app/shared";
import { fetchGrammarList, GRAMMAR_PAGE_SIZE as PAGE_SIZE } from "../api";
import GrammarCard, {
  type GrammarListLocationState,
} from "../components/GrammarCard";

function GrammarListPage() {
  // Coming back from a detail page restores the page the user was on.
  const backState = useLocation().state as GrammarListLocationState | null;
  const [page, setPage] = useState(backState?.page ?? 1);
  const [data, setData] = useState<GrammarListResponse | null>(null);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // Derive current page to prevent out-of-bounds pagination. Before the first
  // response the total is unknown, so keep the requested (e.g. restored) page.
  const currentPage = data ? Math.min(page, totalPages) : page;

  const isLoading = loadedPage !== currentPage;

  useEffect(() => {
    let cancelled = false;

    fetchGrammarList(currentPage, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;

        setData(result);
        setErrorMessage("");
        setLoadedPage(currentPage);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách ngữ pháp.",
        );
        setLoadedPage(currentPage);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  return (
    <div className="grammar-layout">
      <Navbar />

      <main className="grammar-main">
        <div className="grammar-page-header">
          <div>
            <p className="grammar-eyebrow">YUME · NGỮ PHÁP</p>
            <h1>Ngữ pháp</h1>
            <p className="grammar-description">
              Các mẫu ngữ pháp tiếng Nhật theo cấp độ JLPT.
            </p>
          </div>

          <div className="grammar-total-card">
            <span>Tổng số ngữ pháp</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
        </div>

        {errorMessage && (
          <p className="grammar-error" role="alert">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <p className="grammar-note">Đang tải danh sách...</p>
        ) : (
          data &&
          (data.grammars.length === 0 ? (
            <p className="grammar-note">
              Chưa có dữ liệu ngữ pháp nào trong hệ thống
            </p>
          ) : (
            <div className="grammar-list">
              {data.grammars.map((grammar) => (
                <GrammarCard
                  key={grammar.id}
                  grammar={grammar}
                  listState={{ page: currentPage }}
                />
              ))}
            </div>
          ))
        )}

        {data && data.total > 0 && (
          <nav className="grammar-pagination" aria-label="Phân trang">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Trang trước
            </button>

            <span>
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Trang sau
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

export default GrammarListPage;
