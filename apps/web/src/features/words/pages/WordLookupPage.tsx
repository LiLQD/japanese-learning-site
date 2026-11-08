import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { WordListResponse } from "@app/shared";
import Navbar from "../../../components/Navbar";
import WordListItem from "../components/WordListItem";
import { useAuth } from "../../../contexts/auth-context";
import { fetchWordList, WORDS_PAGE_SIZE } from "../api";
import "./WordsPage.css";

function WordLookupPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WordListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { user } = useAuth();

  const requestKey = `${query}:${page}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    fetchWordList(query, page, WORDS_PAGE_SIZE)
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
            : "Không thể tải danh sách từ vựng.",
        );
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [page, query, requestKey]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(input.trim());
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / WORDS_PAGE_SIZE))
    : 1;

  return (
    <div className="words-layout">
      <Navbar />

      <main className="words-main">
        <section className="words-hero">
          <div className="words-hero-copy">
            <p className="words-eyebrow">YUME · TỪ ĐIỂN NHẬT VIỆT</p>
            <h1>Tra cứu từ vựng</h1>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h1>Tra cứu từ vựng</h1>
              {user?.role === "ADMIN" && (
                <Link
                  to="/words/new"
                  style={{
                    padding: "8px 16px",
                    background: "var(--color-brand)",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                >
                  + Thêm từ mới
                </Link>
              )}
            </div>
            <p>Tìm từ bằng chữ Nhật, cách đọc Kana hoặc nghĩa tiếng Việt.</p>
          </div>
          <span className="words-hero-mark" lang="ja" aria-hidden="true">
            言葉
          </span>

          <form className="words-search-form" onSubmit={handleSearch}>
            <label className="words-search-label" htmlFor="word-search">
              Từ khóa
            </label>
            <div className="words-search-control">
              <input
                id="word-search"
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ví dụ: 日本語, にほんご, tiếng Nhật"
                autoComplete="off"
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tìm..." : "Tìm kiếm"}
              </button>
            </div>
          </form>
        </section>

        <section
          className="words-results"
          aria-labelledby="words-results-heading"
        >
          <div className="words-section-heading">
            <div>
              <p className="words-eyebrow">KẾT QUẢ TRA CỨU</p>
              <h2 id="words-results-heading">
                {query ? `Từ khóa “${query}”` : "Khám phá từ vựng"}
              </h2>
            </div>
            {data && !errorMessage && (
              <span className="words-result-count">
                {data.total.toLocaleString("vi-VN")} kết quả
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="words-state words-error" role="alert">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <div className="words-state" role="status">
              <span className="words-spinner" aria-hidden="true" />
              Đang tải từ vựng...
            </div>
          ) : !errorMessage && data?.words.length === 0 ? (
            <div className="words-state words-empty" role="status">
              <span className="words-empty-mark" aria-hidden="true">
                あ
              </span>
              <strong>Không tìm thấy từ vựng phù hợp</strong>
              <span>Thử một từ khóa khác bằng tiếng Nhật hoặc tiếng Việt.</span>
            </div>
          ) : (
            !errorMessage &&
            data && (
              <div className="words-result-list">
                {data.words.map((word) => (
                  <WordListItem key={word.id} word={word} />
                ))}
              </div>
            )
          )}

          {data && data.total > 0 && !errorMessage && (
            <nav className="words-pagination" aria-label="Phân trang từ vựng">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1 || isLoading}
              >
                ← Trang trước
              </button>
              <span>
                Trang <strong>{page}</strong> / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages || isLoading}
              >
                Trang sau →
              </button>
            </nav>
          )}
        </section>

        <footer className="words-footer">
          <span>Học một từ mới mỗi ngày.</span>
          <Link to="/kanji">
            Khám phá Hán tự <span aria-hidden="true">↗</span>
          </Link>
        </footer>
      </main>
    </div>
  );
}

export default WordLookupPage;
