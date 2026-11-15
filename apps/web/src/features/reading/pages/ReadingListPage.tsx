import { useEffect, useState } from "react";
import { Link } from "react-router";
import Navbar from "../../../components/Navbar";
import ConfirmDialog from "../../kanji/components/ConfirmDialog";
import { useAuth } from "../../../contexts/auth-context";
import {
  fetchReadingList,
  deleteReading,
  type ReadingListResponse,
  type ReadingPassage,
} from "../api";
import "./ReadingListPage.css";

export default function ReadingListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [readings, setReadings] = useState<ReadingPassage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [pendingDelete, setPendingDelete] = useState<ReadingPassage | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchReadingList()
      .then((result: ReadingListResponse) => {
        if (cancelled) return;
        setReadings(result.passages); // API trả về { passages: [...] }
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách bài đọc.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteReading(pendingDelete.id);
      setPendingDelete(null);
      setIsLoading(true);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Lỗi khi xóa bài đọc.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="reading-layout">
      <Navbar />
      <main className="reading-main">
        <div
          className="reading-page-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <p className="reading-eyebrow">YUME · BÀI ĐỌC</p>
            <h1>Bài đọc tiếng Nhật</h1>
            <p className="reading-description">
              Luyện đọc hiểu theo cấp độ JLPT.
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/reading/new"
              style={{
                padding: "10px 20px",
                background: "var(--color-brand)",
                color: "white",
                textDecoration: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              + Thêm bài đọc
            </Link>
          )}
        </div>

        {errorMessage && (
          <p
            className="reading-error"
            role="alert"
            style={{ color: "red", marginBottom: "16px" }}
          >
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <p className="reading-note">Đang tải danh sách...</p>
        ) : readings.length === 0 ? (
          <p className="reading-note">Chưa có bài đọc nào trong hệ thống.</p>
        ) : (
          <div className="reading-grid">
            {readings.map((reading) => (
              <div
                key={reading.id}
                className="reading-card"
                style={{ position: "relative" }}
              >
                <Link
                  to={`/reading/${reading.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="reading-card-header">
                    <h2>{reading.title}</h2>
                    {reading.jlpt && (
                      <span className="jlpt-badge">N{reading.jlpt}</span>
                    )}
                  </div>
                </Link>

                {isAdmin && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "16px",
                      borderTop: "1px solid var(--color-line)",
                      paddingTop: "16px",
                    }}
                  >
                    <Link
                      to={`/reading/${reading.id}/edit`}
                      style={{
                        padding: "6px 12px",
                        background: "#e2e8f0",
                        borderRadius: "4px",
                        textDecoration: "none",
                        color: "var(--color-ink)",
                        fontSize: "13px",
                      }}
                    >
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(reading)}
                      style={{
                        padding: "6px 12px",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {pendingDelete && (
        <ConfirmDialog
          title="Xóa bài đọc"
          confirmLabel="Xóa"
          busyLabel="Đang xóa..."
          isBusy={isDeleting}
          errorMessage={deleteError}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError("");
          }}
        >
          Bạn có chắc chắn muốn xóa bài đọc{" "}
          <strong>{pendingDelete.title}</strong> không? Hành động này không thể
          hoàn tác.
        </ConfirmDialog>
      )}
    </div>
  );
}
