import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Navbar from "../../../components/Navbar";
import { fetchReadingResult, type ReadingResultDetailResponse } from "../api";
import "./ReadingResultPage.css";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes} phút ${remainingSeconds} giây`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("vi-VN");
}

export default function ReadingResultPage() {
  const { resultId } = useParams();
  const [data, setData] = useState<ReadingResultDetailResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResult() {
      try {
        const id = Number(resultId);

        if (!Number.isInteger(id) || id <= 0) {
          throw new Error("Mã kết quả không hợp lệ.");
        }

        const response = await fetchReadingResult(id);
        setData(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải kết quả bài đọc.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadResult();
  }, [resultId]);

  return (
    <>
      <Navbar />

      <main className="reading-result-page">
        <div className="reading-result-container">
          <Link to="/reading" className="reading-result-back">
            ← Quay lại danh sách bài đọc
          </Link>

          {loading && (
            <div className="reading-result-message">Đang tải kết quả...</div>
          )}

          {!loading && error && (
            <div className="reading-result-message error">{error}</div>
          )}

          {!loading && !error && data && (
            <>
              <section className="reading-result-summary">
                <span className="reading-result-eyebrow">
                  READING COMPREHENSION
                </span>

                <h1>KẾT QUẢ BÀI ĐỌC</h1>
                <h2>{data.passage.title}</h2>

                <div className="reading-result-score">
                  <strong>{data.score.toFixed(2)}</strong>
                  <span>/ 10 điểm</span>
                </div>

                <div className="reading-result-stats">
                  <div>
                    <strong>
                      {data.correctCount}/{data.totalCount}
                    </strong>
                    <span>Số câu đúng</span>
                  </div>

                  <div>
                    <strong>{formatTime(data.timeSpent)}</strong>
                    <span>Thời gian làm bài</span>
                  </div>

                  <div>
                    <strong>
                      {data.totalCount > 0
                        ? `${Math.round(
                            (data.correctCount / data.totalCount) * 100,
                          )}%`
                        : "0%"}
                    </strong>
                    <span>Tỷ lệ chính xác</span>
                  </div>
                </div>

                <p className="reading-result-date">
                  Thời gian nộp bài: {formatDate(data.createdAt)}
                </p>
              </section>

              <section className="reading-result-review">
                <h2>CHI TIẾT ĐÁP ÁN</h2>
                <p>
                  Xem lại câu trả lời của bạn và đáp án chính xác cho từng câu
                  hỏi.
                </p>

                {data.details.map((detail, index) => (
                  <article
                    className={`reading-result-question ${
                      detail.isCorrect ? "correct" : "incorrect"
                    }`}
                    key={detail.id}
                  >
                    <div className="reading-result-question-heading">
                      <strong>Câu {index + 1}</strong>
                      <span>
                        {detail.isCorrect ? "Chính xác" : "Chưa chính xác"}
                      </span>
                    </div>

                    <h3>{detail.question.question}</h3>

                    <div className="reading-result-options">
                      {detail.question.options.map((option, optionIndex) => {
                        const isSelected =
                          detail.selectedOption === optionIndex;
                        const isAnswer =
                          detail.question.correctIndex === optionIndex;

                        return (
                          <div
                            className={[
                              "reading-result-option",
                              isSelected ? "selected" : "",
                              isAnswer ? "answer" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            key={optionIndex}
                          >
                            <span>
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span>{option}</span>

                            {isAnswer && <strong>Đáp án đúng</strong>}

                            {isSelected && !isAnswer && (
                              <strong>Bạn đã chọn</strong>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </section>

              <div className="reading-result-actions">
                <Link to="/reading">Quay lại danh sách bài đọc</Link>
                <Link to={`/reading/${data.passage.id}/questions`}>
                  Làm lại bài đọc
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
