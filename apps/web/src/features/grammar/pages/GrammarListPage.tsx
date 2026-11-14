import Navbar from "../../../components/Navbar";
import "./GrammarListPage.css";
import { useEffect, useState } from "react";
import {
  GRAMMAR_KEYWORD_MAX_LENGTH,
  type GrammarListResponse,
} from "@app/shared";
import { fetchGrammarList, GRAMMAR_PAGE_SIZE as PAGE_SIZE } from "../api";
import GrammarCard from "../components/GrammarCard";

// Wait for the user to stop typing before searching.
const SEARCH_DELAY_MS = 300;
const JLPT_OPTIONS = [5, 4, 3, 2, 1];

function GrammarListPage() {
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [jlpt, setJlpt] = useState<number | undefined>(undefined);
  const [data, setData] = useState<GrammarListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isFiltering = Boolean(keyword || jlpt);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // Derive current page to prevent out-of-bounds pagination
  const currentPage = Math.min(page, totalPages);

  const requestKey = `${currentPage}:${keyword}:${jlpt ?? ""}`;
  const isLoading = loadedKey !== requestKey;

  // Apply the typed keyword after a short pause.
  useEffect(() => {
    const trimmed = keywordInput.trim();
    if (trimmed === keyword) return;

    const timer = setTimeout(() => {
      setKeyword(trimmed);
      setPage(1);
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [keywordInput, keyword]);

  useEffect(() => {
    let cancelled = false;

    fetchGrammarList(currentPage, PAGE_SIZE, { keyword, jlpt })
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

  function handleJlptChange(value: string) {
    setJlpt(value ? Number(value) : undefined);
    setPage(1);
  }

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
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Tìm theo mẫu ngữ pháp, tên hoặc ý nghĩa..."
            aria-label="Tìm kiếm ngữ pháp"
            maxLength={GRAMMAR_KEYWORD_MAX_LENGTH}
          />

          <select
            value={jlpt ?? ""}
            onChange={(event) => handleJlptChange(event.target.value)}
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
                <GrammarCard key={grammar.id} grammar={grammar} />
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
