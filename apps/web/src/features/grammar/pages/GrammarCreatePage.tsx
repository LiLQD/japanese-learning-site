import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { grammarCreateInputSchema, type GrammarCreateInput } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import { createGrammar } from "../api";
import "./GrammarCreatePage.css";

type GrammarFormValues = {
  title: string;
  pattern: string;
  meaning: string;
  jlpt: string;
};

type ExampleValue = {
  key: number;
  japanese: string;
  vietnamese: string;
};

const EMPTY_VALUES: GrammarFormValues = {
  title: "",
  pattern: "",
  meaning: "",
  jlpt: "",
};

const JLPT_OPTIONS = [1, 2, 3, 4, 5];

function GrammarCreatePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const nextExampleKey = useRef(0);
  const [values, setValues] = useState(EMPTY_VALUES);
  const [examples, setExamples] = useState<ExampleValue[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearValidation() {
    setFieldErrors({});
    setFormError("");
  }

  function handleValueChange(field: keyof GrammarFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    clearValidation();
  }

  function addExample() {
    const key = nextExampleKey.current;
    nextExampleKey.current += 1;
    setExamples((current) => [
      ...current,
      { key, japanese: "", vietnamese: "" },
    ]);
    clearValidation();
  }

  function updateExample(
    key: number,
    field: "japanese" | "vietnamese",
    value: string,
  ) {
    setExamples((current) =>
      current.map((example) =>
        example.key === key ? { ...example, [field]: value } : example,
      ),
    );
    clearValidation();
  }

  function removeExample(key: number) {
    setExamples((current) => current.filter((example) => example.key !== key));
    clearValidation();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const input: GrammarCreateInput = {
      title: values.title,
      pattern: values.pattern,
      meaning: values.meaning,
      jlpt: Number(values.jlpt),
      examples: examples.map(({ japanese, vietnamese }) => ({
        japanese,
        vietnamese,
      })),
    };
    const result = grammarCreateInputSchema.safeParse(input);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path.join(".")] ??= issue.message;
      }
      setFieldErrors(errors);
      setFormError("Vui lòng kiểm tra lại các thông tin đã nhập.");
      return;
    }

    clearValidation();
    setIsSubmitting(true);

    try {
      await createGrammar(result.data);
      void navigate("/admin/grammar", {
        state: { successMessage: "Thêm ngữ pháp thành công." },
      });
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể lưu dữ liệu ngữ pháp. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading) {
    return (
      <main>
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <p>
          Vui lòng <Link to="/login">đăng nhập</Link> để tiếp tục.
        </p>
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main>
        <p>Bạn không có quyền truy cập trang này.</p>
        <Link to="/admin/grammar">Về danh sách ngữ pháp</Link>
      </main>
    );
  }

  return (
    <div className="grammar-create-layout">
      <Navbar />
      <main className="grammar-create-main">
        <header className="grammar-create-header">
          <div>
            <p className="grammar-create-eyebrow">YUME · QUẢN TRỊ</p>
            <h1>Thêm ngữ pháp</h1>
            <p>Các trường có dấu * là bắt buộc.</p>
          </div>
        </header>

        {formError && (
          <p className="grammar-create-error" role="alert">
            {formError}
          </p>
        )}

        <form
          className="grammar-create-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <label className="grammar-create-field">
            <span>
              Tên ngữ pháp <em>*</em>
            </span>
            <input
              value={values.title}
              onChange={(event) =>
                handleValueChange("title", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title && <small>{fieldErrors.title}</small>}
          </label>

          <label className="grammar-create-field">
            <span>
              Cấu trúc ngữ pháp <em>*</em>
            </span>
            <textarea
              value={values.pattern}
              onChange={(event) =>
                handleValueChange("pattern", event.target.value)
              }
              lang="ja"
              aria-invalid={Boolean(fieldErrors.pattern)}
            />
            {fieldErrors.pattern && <small>{fieldErrors.pattern}</small>}
          </label>

          <label className="grammar-create-field">
            <span>
              Ý nghĩa <em>*</em>
            </span>
            <textarea
              value={values.meaning}
              onChange={(event) =>
                handleValueChange("meaning", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.meaning)}
            />
            {fieldErrors.meaning && <small>{fieldErrors.meaning}</small>}
          </label>

          <label className="grammar-create-field">
            <span>
              Trình độ JLPT <em>*</em>
            </span>
            <select
              value={values.jlpt}
              onChange={(event) =>
                handleValueChange("jlpt", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.jlpt)}
            >
              <option value="">-- Chọn trình độ --</option>
              {JLPT_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  N{level}
                </option>
              ))}
            </select>
            {fieldErrors.jlpt && <small>{fieldErrors.jlpt}</small>}
          </label>

          <section
            className="grammar-create-examples"
            aria-labelledby="examples-title"
          >
            <div className="grammar-create-examples-heading">
              <div>
                <h2 id="examples-title">Ví dụ minh họa</h2>
                <p>Có thể bỏ qua nếu chưa có ví dụ.</p>
              </div>
              <button
                className="grammar-create-button-secondary"
                type="button"
                onClick={addExample}
                disabled={isSubmitting}
              >
                Thêm ví dụ
              </button>
            </div>

            {examples.map((example, index) => (
              <fieldset className="grammar-create-example" key={example.key}>
                <legend>Ví dụ {index + 1}</legend>
                <label className="grammar-create-field">
                  <span>
                    Câu tiếng Nhật <em>*</em>
                  </span>
                  <textarea
                    value={example.japanese}
                    onChange={(event) =>
                      updateExample(example.key, "japanese", event.target.value)
                    }
                    lang="ja"
                    aria-invalid={Boolean(
                      fieldErrors[`examples.${index}.japanese`],
                    )}
                  />
                  {fieldErrors[`examples.${index}.japanese`] && (
                    <small>{fieldErrors[`examples.${index}.japanese`]}</small>
                  )}
                </label>

                <label className="grammar-create-field">
                  <span>
                    Bản dịch tiếng Việt <em>*</em>
                  </span>
                  <textarea
                    value={example.vietnamese}
                    onChange={(event) =>
                      updateExample(
                        example.key,
                        "vietnamese",
                        event.target.value,
                      )
                    }
                    aria-invalid={Boolean(
                      fieldErrors[`examples.${index}.vietnamese`],
                    )}
                  />
                  {fieldErrors[`examples.${index}.vietnamese`] && (
                    <small>{fieldErrors[`examples.${index}.vietnamese`]}</small>
                  )}
                </label>

                <button
                  className="grammar-create-remove-example"
                  type="button"
                  onClick={() => removeExample(example.key)}
                  disabled={isSubmitting}
                >
                  Xóa ví dụ
                </button>
              </fieldset>
            ))}
          </section>

          <div className="grammar-create-actions">
            <button
              className="grammar-create-button-secondary"
              type="button"
              onClick={() => void navigate("/admin/grammar")}
              disabled={isSubmitting}
            >
              Quay lại
            </button>
            <button
              className="grammar-create-button-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu ngữ pháp"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default GrammarCreatePage;
