import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import type { GrammarListResponse } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { fetchGrammarList, GRAMMAR_PAGE_SIZE as PAGE_SIZE } from "../api";
import GrammarCard from "../components/GrammarCard";
import "./GrammarListPage.css";

export type GrammarListLocationState = { page?: number };
function GrammarListPage() {
  const location = useLocation();
  const listState = location.state as GrammarListLocationState | null;
  const initialPage =
    listState?.page && listState.page > 0 ? listState.page : 1;

  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<GrammarListResponse | null>(null);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Search states from PR #66
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [jlpt, setJlpt] = useState("");

  // Debounce logic from PR #66
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(input.trim());
      setPage(1); // Reset page when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const isLoading = loadedPage !== currentPage;

  useEffect(() => {
    let cancelled = false;
    const jlptNumber = jlpt ? Number(jlpt) : undefined;

    fetchGrammarList(currentPage, PAGE_SIZE, keyword, jlptNumber)
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
  }, [currentPage, keyword, jlpt]);

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

        {/* Search & Filter UI from PR #66 */}
        <div className="grammar-filters">
          <input
            type="search"
            className="grammar-search-input"
            placeholder="Tìm theo tên, cấu trúc, ý nghĩa..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <select
            className="grammar-jlpt-select"
            value={jlpt}
            onChange={(e) => {
              setJlpt(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả cấp độ</option>
            <option value="5">N5</option>
            <option value="4">N4</option>
            <option value="3">N3</option>
            <option value="2">N2</option>
            <option value="1">N1</option>
          </select>
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
              {keyword || jlpt
                ? "Không tìm thấy ngữ pháp phù hợp với bộ lọc."
                : "Chưa có dữ liệu ngữ pháp nào trong hệ thống"}
            </p>
          ) : (
            <div className="grammar-list">
              {data.grammars.map((grammar) => (
                <GrammarCard
                  key={grammar.id}
                  grammar={grammar}
                  state={{ page: currentPage }} // Pass state from PR #67
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
