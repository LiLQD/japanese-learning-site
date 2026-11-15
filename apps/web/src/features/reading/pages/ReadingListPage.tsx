import { useEffect, useState } from "react";
import { Link } from "react-router";
import Navbar from "../../../components/Navbar";
import ConfirmDialog from "../../kanji/components/ConfirmDialog";
import { useAuth } from "../../../contexts/auth-context";
import { fetchReadingList, deleteReading, type ReadingPassage } from "../api";
import "./ReadingListPage.css";

export default function ReadingListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State cho việc xóa
  const [pendingDelete, setPendingDelete] = useState<ReadingPassage | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchReadingList()
      .then((data) => {
        if (isMounted) {
          setPassages(data.passages);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải danh sách bài đọc.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchReadingList();
      setPassages(data.passages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách bài đọc.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteReading(pendingDelete.id);
      setPendingDelete(null);
      // Load lại danh sách sau khi xóa thành công
      await handleRetry();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Lỗi khi xóa bài đọc.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="reading-page">
      <Navbar />

      <main className="reading-main">
        <section className="reading-hero">
          <span className="reading-eyebrow">YUME JAPANESE LEARNING</span>
          <h1>Luyện đọc tiếng Nhật</h1>
          <p>
            Khám phá các bài đọc tiếng Nhật theo cấp độ JLPT và nâng cao khả
            năng đọc hiểu của bạn.
          </p>
        </section>

        <section className="reading-content">
          <div className="reading-section-heading">
            <div>
              <h2>Danh sách bài đọc</h2>
              <p>Chọn nội dung phù hợp với trình độ tiếng Nhật của bạn.</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span className="reading-count">{passages.length} bài đọc</span>
              {isAdmin && (
                <Link
                  to="/reading/new"
                  style={{
                    padding: "8px 16px",
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
          </div>

          {loading && (
            <div className="reading-state">Đang tải danh sách bài đọc...</div>
          )}

          {!loading && error && (
            <div className="reading-state reading-error">
              <p>{error}</p>
              <button type="button" onClick={() => void handleRetry()}>
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && passages.length === 0 && (
            <div className="reading-state">Hiện chưa có bài đọc nào.</div>
          )}

          {!loading && !error && passages.length > 0 && (
            <div className="reading-grid">
              {passages.map((passage) => (
                <div
                  className="reading-card"
                  key={passage.id}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  {/* Bọc nội dung vào Link, không bọc nút Admin vào trong */}
                  <Link
                    to={`/reading/${passage.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      flex: 1,
                    }}
                  >
                    <div className="reading-card-top">
                      <span className="reading-card-label">BÀI ĐỌC</span>
                      <span className="reading-level">
                        {passage.jlpt !== null
                          ? `JLPT N${passage.jlpt}`
                          : "Chưa phân cấp"}
                      </span>
                    </div>

                    <h3>{passage.title}</h3>

                    <div className="reading-card-footer">
                      <span>Mã bài đọc: #{passage.id}</span>
                    </div>
                  </Link>

                  {/* Các nút Admin nằm ngoài Link */}
                  {isAdmin && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--color-line)",
                      }}
                    >
                      <Link
                        to={`/reading/${passage.id}/edit`}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "6px 0",
                          background: "#e2e8f0",
                          borderRadius: "6px",
                          textDecoration: "none",
                          color: "var(--color-ink)",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        Sửa
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(passage)}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          background: "#fee2e2",
                          color: "#b91c1c",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
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
        </section>
      </main>

      {/* Hộp thoại xác nhận xóa */}
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
