import { useRef, useState, type FormEvent } from "react";
import {
  grammarCreateInputSchema,
  grammarUpdateInputSchema,
  type GrammarAdminDetail,
  type GrammarCreateInput,
  type GrammarUpdateInput,
} from "@app/shared";
import "../pages/GrammarCreatePage.css";

type FormValues = {
  title: string;
  pattern: string;
  meaning: string;
  jlpt: string;
};

type ExampleValue = {
  key: number;
  id?: number;
  japanese: string;
  vietnamese: string;
};

type GrammarFormProps =
  | {
      mode: "create";
      onSubmit: (input: GrammarCreateInput) => Promise<void>;
      onCancel: () => void;
    }
  | {
      mode: "edit";
      initialGrammar: GrammarAdminDetail;
      onSubmit: (input: GrammarUpdateInput) => Promise<void>;
      onCancel: () => void;
    };

const EMPTY_VALUES: FormValues = {
  title: "",
  pattern: "",
  meaning: "",
  jlpt: "",
};
const JLPT_OPTIONS = [1, 2, 3, 4, 5];

function GrammarForm(props: GrammarFormProps) {
  const nextExampleKey = useRef(
    props.mode === "edit" ? props.initialGrammar.examples.length : 0,
  );
  const [values, setValues] = useState<FormValues>(() =>
    props.mode === "edit"
      ? {
          title: props.initialGrammar.title,
          pattern: props.initialGrammar.pattern,
          meaning: props.initialGrammar.meaning,
          jlpt:
            props.initialGrammar.jlpt === null
              ? ""
              : String(props.initialGrammar.jlpt),
        }
      : EMPTY_VALUES,
  );
  const [examples, setExamples] = useState<ExampleValue[]>(() =>
    props.mode === "edit"
      ? props.initialGrammar.examples.map((example, index) => ({
          key: index,
          id: example.id,
          japanese: example.japanese,
          vietnamese: example.vietnamese,
        }))
      : [],
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearValidation() {
    setFieldErrors({});
    setFormError("");
  }

  function handleValueChange(field: keyof FormValues, value: string) {
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

    const common = {
      title: values.title,
      pattern: values.pattern,
      meaning: values.meaning,
    };
    const exampleValues = examples.map(({ id, japanese, vietnamese }) =>
      props.mode === "edit"
        ? { ...(id === undefined ? {} : { id }), japanese, vietnamese }
        : { japanese, vietnamese },
    );

    if (props.mode === "create") {
      const result = grammarCreateInputSchema.safeParse({
        ...common,
        jlpt: Number(values.jlpt),
        examples: exampleValues,
      });
      if (!result.success) {
        showValidationErrors(result.error.issues);
        return;
      }
      await submitValidated(() => props.onSubmit(result.data));
      return;
    }

    const result = grammarUpdateInputSchema.safeParse({
      ...common,
      jlpt: values.jlpt === "" ? null : Number(values.jlpt),
      examples: exampleValues,
    });
    if (!result.success) {
      showValidationErrors(result.error.issues);
      return;
    }
    await submitValidated(() => props.onSubmit(result.data));
  }

  function showValidationErrors(
    issues: { path: PropertyKey[]; message: string }[],
  ) {
    const errors: Record<string, string> = {};
    for (const issue of issues) {
      errors[issue.path.join(".")] ??= issue.message;
    }
    setFieldErrors(errors);
    setFormError("Vui lòng kiểm tra lại các thông tin đã nhập.");
  }

  async function submitValidated(submit: () => Promise<void>) {
    clearValidation();
    setIsSubmitting(true);
    try {
      await submit();
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

  const isEdit = props.mode === "edit";

  return (
    <main className="grammar-create-main">
      <header className="grammar-create-header">
        <div>
          <p className="grammar-create-eyebrow">YUME · QUẢN TRỊ</p>
          <h1>{isEdit ? "Sửa ngữ pháp" : "Thêm ngữ pháp"}</h1>
          <p>Các trường có dấu * là bắt buộc.</p>
        </div>
      </header>

      {formError && (
        <p className="grammar-create-error" role="alert">
          {formError}
        </p>
      )}

      <form className="grammar-create-form" onSubmit={handleSubmit} noValidate>
        <label className="grammar-create-field">
          <span>
            Tên ngữ pháp <em>*</em>
          </span>
          <input
            value={values.title}
            onChange={(event) => handleValueChange("title", event.target.value)}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.meaning)}
          />
          {fieldErrors.meaning && <small>{fieldErrors.meaning}</small>}
        </label>

        <label className="grammar-create-field">
          <span>Trình độ JLPT {props.mode === "create" && <em>*</em>}</span>
          <select
            value={values.jlpt}
            onChange={(event) => handleValueChange("jlpt", event.target.value)}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.jlpt)}
          >
            <option value="">
              {isEdit ? "Chưa phân loại" : "-- Chọn trình độ --"}
            </option>
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
                  disabled={isSubmitting}
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
                    updateExample(example.key, "vietnamese", event.target.value)
                  }
                  disabled={isSubmitting}
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
            onClick={props.onCancel}
            disabled={isSubmitting}
          >
            Quay lại
          </button>
          <button
            className="grammar-create-button-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEdit
                ? "Đang cập nhật..."
                : "Đang lưu..."
              : isEdit
                ? "Lưu thay đổi"
                : "Lưu ngữ pháp"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default GrammarForm;
