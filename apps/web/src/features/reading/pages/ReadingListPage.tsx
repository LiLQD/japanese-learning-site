import { useEffect, useState } from "react";
import { Link } from "react-router";
import Navbar from "../../../components/Navbar";
import { fetchReadingList, type ReadingPassage } from "../api";
import "./ReadingListPage.css";

export default function ReadingListPage() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

            <span className="reading-count">{passages.length} bài đọc</span>
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
                <Link
                  to={`/reading/${passage.id}`}
                  className="reading-card"
                  key={passage.id}
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
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
