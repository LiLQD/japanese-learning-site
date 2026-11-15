import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  GRAMMAR_KEYWORD_MAX_LENGTH,
  type GrammarListResponse,
} from "@app/shared";
import Navbar from "../../../components/Navbar";
import { fetchGrammarList, GRAMMAR_PAGE_SIZE as PAGE_SIZE } from "../api";
import GrammarCard from "../components/GrammarCard";
import "./GrammarListPage.css";

// Carried to the detail page and back, so "Quay lại danh sách" restores the
// page and the search conditions the user had.
export type GrammarListLocationState = {
  page?: number;
  keyword?: string;
  jlpt?: string;
};

// Wait for the user to stop typing before searching.
const SEARCH_DELAY_MS = 300;
const JLPT_OPTIONS = [5, 4, 3, 2, 1];

function GrammarListPage() {
  const restored = useLocation().state as GrammarListLocationState | null;

  const [page, setPage] = useState(
    restored?.page && restored.page > 0 ? restored.page : 1,
  );
  const [input, setInput] = useState(restored?.keyword ?? "");
  const [keyword, setKeyword] = useState(restored?.keyword ?? "");
  const [jlpt, setJlpt] = useState(restored?.jlpt ?? "");
  const [data, setData] = useState<GrammarListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isFiltering = Boolean(keyword || jlpt);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  // Keep page in range once the total is known; before the first response
  // keep the requested (possibly restored) page.
  const currentPage = data ? Math.min(page, totalPages) : page;
  const requestKey = `${currentPage}:${keyword}:${jlpt}`;
  const isLoading = loadedKey !== requestKey;

  // Apply the typed keyword after a short pause. Only a real change resets
  // the page, so a restored page survives the first render.
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === keyword) return;

    const timer = setTimeout(() => {
      setKeyword(trimmed);
      setPage(1);
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [input, keyword]);

  useEffect(() => {
    let cancelled = false;

    fetchGrammarList(
      currentPage,
      PAGE_SIZE,
      keyword,
      jlpt ? Number(jlpt) : undefined,
    )
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
            : "Không thể tải danh sách ngữ pháp.",
        );
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, keyword, jlpt, requestKey]);

  const listState: GrammarListLocationState = {
    page: currentPage,
    keyword,
    jlpt,
  };

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
            <span>{isFiltering ? "Kết quả tìm kiếm" : "Tổng số ngữ pháp"}</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
        </div>

        <div className="grammar-search" role="search">
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tìm theo mẫu ngữ pháp, tên hoặc ý nghĩa..."
            aria-label="Tìm kiếm ngữ pháp"
            maxLength={GRAMMAR_KEYWORD_MAX_LENGTH}
          />

          <select
            value={jlpt}
            onChange={(event) => {
              setJlpt(event.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo cấp độ JLPT"
          >
            <option value="">Tất cả cấp độ</option>
            {JLPT_OPTIONS.map((level) => (
              <option key={level} value={level}>
                N{level}
              </option>
            ))}
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
          !errorMessage &&
          (data.grammars.length === 0 ? (
            <p className="grammar-note" role="status">
              {isFiltering
                ? "Không tìm thấy ngữ pháp phù hợp"
                : "Chưa có dữ liệu ngữ pháp nào trong hệ thống"}
            </p>
          ) : (
            <div className="grammar-list">
              {data.grammars.map((grammar) => (
                <GrammarCard
                  key={grammar.id}
                  grammar={grammar}
                  listState={listState}
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
