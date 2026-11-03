import Navbar from "../../../components/Navbar";
import "./KanjiListPage.css";
import { useEffect, useState } from "react";
import type { KanjiListResponse } from "@app/shared";
import { fetchKanjiList } from "../api";
import KanjiTable from "../components/KanjiTable";

const PAGE_SIZE = 20;

// Public page: guests and users can browse; admin actions come in US-22/23/24.
function KanjiListPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<KanjiListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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

          <div className="kanji-total-card">
            <span>Tổng số chữ Kanji</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
        </div>

        {errorMessage && <p role="alert">{errorMessage}</p>}

        {isLoading ? (
          <p>Đang tải danh sách...</p>
        ) : (
          data && <KanjiTable kanji={data.kanji} />
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
