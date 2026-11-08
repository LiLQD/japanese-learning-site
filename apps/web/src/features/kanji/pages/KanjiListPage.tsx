
import Navbar from "../../../components/Navbar";
import "./KanjiListPage.css";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { KanjiListItem, KanjiListResponse } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import {
  CONNECTION_ERROR,
  deleteKanji,
  fetchKanjiList,
  KANJI_NOT_FOUND,
  KANJI_PAGE_SIZE as PAGE_SIZE,
} from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
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
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<KanjiListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    locationState?.message ?? "",
  );

  // Bumped to refetch the current page (e.g. after a delete).
  const [reloadCount, setReloadCount] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<KanjiListItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Clear the one-time message so it does not reappear on reload.
  useEffect(() => {
    if (location.state) {
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const requestKey = `${page}:${keyword}:${reloadCount}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    fetchKanjiList(page, PAGE_SIZE, keyword)
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
  }, [page, keyword, requestKey]);

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setPage(1);
    setStatusMessage("");
  }

  function openDeleteDialog(item: KanjiListItem) {
    setPendingDelete(item);
    setDeleteError("");
    setStatusMessage("");
  }

  const closeDeleteDialog = useCallback(() => {
    setPendingDelete(null);
    setDeleteError("");
  }, []);

  async function handleConfirmDelete() {
    if (!pendingDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteKanji(pendingDelete.id);
      setPendingDelete(null);
      setStatusMessage("Xóa thành công!");
      refreshAfterDelete();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Đã có lỗi xảy ra.";

      setDeleteError(
        message === CONNECTION_ERROR
          ? CONNECTION_ERROR
          : `Xóa thất bại! ${message}`,
      );

      // Someone else already deleted it: refresh so the row disappears.
      if (message === KANJI_NOT_FOUND) refreshAfterDelete();
    } finally {
      setIsDeleting(false);
    }
  }

  // Step back a page when the last row of a page was removed.
  function refreshAfterDelete() {
    if (page > 1 && data?.kanji.length === 1) {
      setPage((p) => p - 1);
    } else {
      setReloadCount((c) => c + 1);
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / PAGE_SIZE))
    : 1;

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

        <div className="kanji-search">
          <input
            type="search"
            value={keyword}
            onChange={(event) => handleKeywordChange(event.target.value)}
            placeholder="Tìm kiếm Kanji hoặc bộ thủ..."
            aria-label="Tìm kiếm Kanji hoặc bộ thủ"
          />

          {keyword && (
            <button
              type="button"
              onClick={() => handleKeywordChange("")}
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {statusMessage && (
          <p className="kanji-status" role="status">
            {statusMessage}
          </p>
        )}

        {errorMessage && <p role="alert">{errorMessage}</p>}

        {isLoading ? (
          <p>Đang tải danh sách...</p>
        ) : data && data.kanji.length > 0 ? (
          <KanjiTable
            kanji={data.kanji}
            isAdmin={isAdmin}
            page={page}
            onDelete={isAdmin ? openDeleteDialog : undefined}
          />
        ) : (
          !errorMessage && (
            <p role="status">
              {keyword.trim()
                ? "Không tìm thấy chữ Kanji phù hợp."
                : "Chưa có dữ liệu Kanji."}
            </p>
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

      {pendingDelete && (
        <ConfirmDialog
          title="Xóa chữ Kanji"
          confirmLabel="Xóa"
          busyLabel="Đang xóa..."
          isBusy={isDeleting}
          errorMessage={deleteError}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={closeDeleteDialog}
        >
          <p>
            Bạn có chắc chắn muốn xóa chữ Kanji{" "}
            <strong lang="ja">{pendingDelete.character}</strong> không?
          </p>
          <p>
            Các liên kết với từ vựng cũng sẽ bị xóa. Thao tác này không thể hoàn
            tác.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default KanjiListPage;
