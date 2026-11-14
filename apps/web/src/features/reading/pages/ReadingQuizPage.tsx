import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import Navbar from "../../../components/Navbar";
import {
  fetchReadingDetail,
  fetchReadingQuestions,
  submitReadingQuiz,
  type ReadingPassageDetail,
  type ReadingQuestion,
} from "../api";
import "./ReadingDetailPage.css";

function getJlptLabel(jlpt: number | null) {
  return typeof jlpt === "number" && jlpt >= 1 && jlpt <= 5
    ? `JLPT N${jlpt}`
    : "Chưa phân cấp";
}

export default function ReadingQuizPage() {
  const { id } = useParams<{ id: string }>();

  return <ReadingQuizContent key={id ?? "missing"} id={id} />;
}

function ReadingQuizContent({ id }: { id: string | undefined }) {
  const passageId = Number(id);
  const invalidId = !Number.isInteger(passageId) || passageId <= 0;

  const [passage, setPassage] = useState<ReadingPassageDetail | null>(null);
  const [questions, setQuestions] = useState<ReadingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (invalidId) return;

    let isMounted = true;

    startTimeRef.current = Date.now();

    Promise.all([
      fetchReadingDetail(passageId),
      fetchReadingQuestions(passageId),
    ])
      .then(([passageResponse, questionsResponse]) => {
        if (!isMounted) return;

        setPassage(passageResponse.passage);
        setQuestions(questionsResponse.questions ?? []);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải câu hỏi đọc hiểu.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [passageId, invalidId]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const progress =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  function handleAnswerChange(questionId: number, optionIndex: number) {
    if (submitted || submitting) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionIndex,
    }));

    setNotice("");
  }

  async function handleSubmit() {
    if (submitted || submitting) return;

    if (totalQuestions === 0) {
      setNotice("Bài đọc hiện chưa có câu hỏi.");
      return;
    }

    if (answeredCount !== totalQuestions) {
      setNotice("Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.");
      return;
    }

    try {
      setSubmitting(true);
      setNotice("");

      const answersPayload = questions.map((question) => ({
        questionId: question.id,
        selectedOption: answers[question.id],
      }));

      const timeSpent = Math.max(
        0,
        Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000),
      );

      const response = await submitReadingQuiz(
        passageId,
        timeSpent,
        answersPayload,
      );

      setSubmitted(true);
      setNotice("Nộp bài thành công!");

      window.location.href = `/reading/results/${response.data.result.id}`;
    } catch (err: unknown) {
      setNotice(
        err instanceof Error
          ? err.message
          : "Không thể nộp bài. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (invalidId) {
    return (
      <div className="reading-detail-page">
        <Navbar />
        <main className="reading-detail-main">
          <section
            className="reading-detail-state reading-detail-error"
            role="alert"
          >
            <h1>Mã bài đọc không hợp lệ</h1>
            <Link to="/reading">Quay lại danh sách bài đọc</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="reading-detail-page">
      <Navbar />

      <main className="reading-detail-main">
        <Link to={`/reading/${passageId}`} className="reading-detail-back">
          ← Quay lại bài đọc
        </Link>

        {loading ? (
          <div className="reading-detail-state" aria-live="polite">
            Đang tải câu hỏi...
          </div>
        ) : error ? (
          <section
            className="reading-detail-state reading-detail-error"
            role="alert"
          >
            <h1>Không thể tải câu hỏi</h1>
            <p>{error}</p>
            <Link to={`/reading/${passageId}`}>Quay lại bài đọc</Link>
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

              <h1>LÀM CÂU HỎI ĐỌC HIỂU</h1>
              <p>{passage.title}</p>
            </section>

            <section className="reading-detail-content">
              {totalQuestions === 0 ? (
                <div className="p-6 text-center bg-white rounded-lg shadow">
                  <p className="text-lg font-semibold text-gray-700">
                    Bài đọc hiện chưa có câu hỏi.
                  </p>

                  <Link
                    to={`/reading/${passageId}`}
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Quay lại đọc nội dung bài
                  </Link>
                </div>
              ) : (
                <div className="reading-quiz">
                  <div className="reading-quiz-header">
                    <div>
                      <span className="reading-quiz-eyebrow">
                        TEST YOUR UNDERSTANDING
                      </span>

                      <h2>LUYỆN TẬP ĐỌC HIỂU</h2>

                      <p>
                        Hãy đọc kỹ từng câu hỏi và chọn một đáp án đúng nhất.
                      </p>
                    </div>

                    <div className="reading-quiz-count">
                      <strong>
                        {answeredCount}/{totalQuestions}
                      </strong>
                      <span>Câu đã trả lời</span>
                    </div>
                  </div>

                  <div
                    className="reading-quiz-progress"
                    role="progressbar"
                    aria-valuenow={answeredCount}
                    aria-valuemin={0}
                    aria-valuemax={totalQuestions}
                    aria-label="Tiến độ trả lời câu hỏi"
                  >
                    <div
                      className="reading-quiz-progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="reading-quiz-questions">
                    {questions.map((question, index) => (
                      <article
                        className="reading-quiz-question"
                        key={question.id}
                      >
                        <h3>
                          Câu {index + 1}: {question.question}
                        </h3>

                        <div className="reading-quiz-options">
                          {question.options.map((option, optionIndex) => (
                            <label
                              className="reading-quiz-option"
                              key={`${question.id}-${optionIndex}`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={optionIndex}
                                checked={answers[question.id] === optionIndex}
                                disabled={submitted || submitting}
                                onChange={() =>
                                  handleAnswerChange(question.id, optionIndex)
                                }
                              />

                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="reading-quiz-submit">
                    <p>
                      Đã trả lời: {answeredCount}/{totalQuestions} câu
                    </p>

                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={submitted || submitting}
                    >
                      {submitting
                        ? "Đang nộp bài..."
                        : submitted
                          ? "Đã nộp bài"
                          : "Nộp bài"}
                    </button>
                  </div>

                  {notice && (
                    <p
                      className="reading-quiz-notice"
                      role={submitted ? "status" : "alert"}
                    >
                      {notice}
                    </p>
                  )}
                </div>
              )}

              <div className="reading-detail-footer">
                <Link to={`/reading/${passageId}`}>← Quay lại bài đọc</Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
