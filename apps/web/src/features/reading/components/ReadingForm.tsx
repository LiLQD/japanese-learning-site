import { useState, type FormEvent } from "react";
import type { ReadingInput } from "@app/shared";

type QuestionType = NonNullable<ReadingInput["questions"]>[number];

type Props = {
  initialValues?: ReadingInput;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (data: ReadingInput) => Promise<void>;
  onCancel: () => void;
};

export default function ReadingForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [content, setContent] = useState(initialValues?.content || "");
  const [translation, setTranslation] = useState(
    initialValues?.translation || "",
  );
  const [jlpt, setJlpt] = useState(initialValues?.jlpt?.toString() || "");
  const [questions, setQuestions] = useState<QuestionType[]>(
    initialValues?.questions || [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        position: questions.length + 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, value: string) => {
    const newQ = [...questions];
    newQ[index].question = value;
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
    setQuestions(newQ);
  };

  const setCorrectAnswer = (qIndex: number, oIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].correctIndex = oIndex;
    setQuestions(newQ);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        translation: translation.trim() || null,
        jlpt: jlpt ? Number(jlpt) : null,
        questions: questions.map((q, i) => ({ ...q, position: i + 1 })),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            background: "#fee2e2",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      <label>
        Tiêu đề *
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", marginTop: "4px" }}
        />
      </label>

      <label>
        Nội dung tiếng Nhật *
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={5}
          style={{ width: "100%", padding: "10px", marginTop: "4px" }}
        />
      </label>

      <label>
        Bản dịch tiếng Việt
        <textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: "10px", marginTop: "4px" }}
        />
      </label>

      <label>
        Cấp độ JLPT
        <select
          value={jlpt}
          onChange={(e) => setJlpt(e.target.value)}
          style={{ width: "100%", padding: "10px", marginTop: "4px" }}
        >
          <option value="">Không có</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              N{n}
            </option>
          ))}
        </select>
      </label>

      <fieldset
        style={{
          border: "1px solid #ccc",
          padding: "16px",
          borderRadius: "8px",
        }}
      >
        <legend>Câu hỏi đọc hiểu</legend>
        {questions.map((q, qi) => (
          <div
            key={qi}
            style={{
              border: "1px dashed #ccc",
              padding: "16px",
              marginBottom: "16px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <strong>Câu hỏi {qi + 1}</strong>
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                style={{
                  color: "red",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Xóa câu hỏi
              </button>
            </div>
            <input
              type="text"
              value={q.question}
              onChange={(e) => updateQuestionText(qi, e.target.value)}
              placeholder="Nhập câu hỏi..."
              required
              style={{ width: "100%", padding: "8px", marginBottom: "12px" }}
            />

            {q.options.map((opt: string, oi: number) => (
              <div
                key={oi}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span>{String.fromCharCode(65 + oi)}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  required
                  style={{ flex: 1, padding: "8px" }}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => setCorrectAnswer(qi, oi)}
                  />
                  Đáp án đúng
                </label>
              </div>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={addQuestion}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          + Thêm câu hỏi mới
        </button>
      </fieldset>

      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "12px 24px",
            background: "var(--color-brand)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: "12px 24px",
            background: "#eee",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
