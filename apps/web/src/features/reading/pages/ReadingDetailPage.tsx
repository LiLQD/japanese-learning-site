import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Navbar from "../../../components/Navbar";
import { fetchReadingDetail, type ReadingPassageDetail } from "../api";
import "./ReadingDetailPage.css";

function getJlptLabel(jlpt: number | null) {
  return typeof jlpt === "number" && jlpt >= 1 && jlpt <= 5
    ? `JLPT N${jlpt}`
    : "Chưa phân cấp";
}

export default function ReadingDetailPage() {
  const { id } = useParams();
  const passageId = Number(id);
  const invalidId = !Number.isInteger(passageId) || passageId <= 0;

  const [passage, setPassage] = useState<ReadingPassageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPassage = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchReadingDetail(passageId);
      setPassage(data.passage);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Không thể tải nội dung bài đọc.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (invalidId) {
      return () => {
        isMounted = false;
      };
    }

    fetchReadingDetail(passageId)
      .then((data) => {
        if (isMounted) {
          setPassage(data.passage);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải nội dung bài đọc.",
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
  }, [invalidId, passageId]);

  return (
    <div className="reading-detail-page">
      <Navbar />

      <main className="reading-detail-main">
        <Link to="/reading" className="reading-detail-back">
          ← Quay lại danh sách bài đọc
        </Link>

        {invalidId ? (
          <section
            className="reading-detail-state reading-detail-error"
            role="alert"
          >
            <h1>Không thể tải bài đọc</h1>
            <p>Mã bài đọc không hợp lệ.</p>
          </section>
        ) : loading ? (
          <div className="reading-detail-state" aria-live="polite">
            Đang tải nội dung bài đọc...
          </div>
        ) : error ? (
          <section
            className="reading-detail-state reading-detail-error"
            role="alert"
          >
            <h1>Không thể tải bài đọc</h1>
            <p>{error}</p>
            <button type="button" onClick={() => void loadPassage()}>
              Thử tải lại
            </button>
          </section>
        ) : passage ? (
          <>
            <section className="reading-detail-hero">
              <span className="reading-detail-eyebrow">
                YUME JAPANESE LEARNING
              </span>

              <span className="reading-detail-level">
                {getJlptLabel(passage.jlpt)}
              </span>

              <h1 lang="ja">{passage.title}</h1>
              <p>Hãy đọc kỹ nội dung tiếng Nhật bên dưới.</p>
            </section>

            <section className="reading-detail-content">
              <div className="reading-detail-heading">
                <span>NỘI DUNG BÀI ĐỌC</span>
                <span>Mã bài đọc: #{passage.id}</span>
              </div>

              <article className="reading-detail-text" lang="ja">
                {passage.content}
              </article>

              <div className="reading-detail-footer">
                <Link to="/reading">← Chọn bài đọc khác</Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
