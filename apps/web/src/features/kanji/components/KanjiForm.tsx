import { useState, type FormEvent } from "react";
import { kanjiInputSchema, type KanjiInput } from "@app/shared";
import { CONNECTION_ERROR } from "../api";

// Inputs keep raw strings; they are converted to KanjiInput on submit.
export type KanjiFormValues = {
  character: string;
  strokeCount: string;
  radical: string;
  jlpt: string;
};

type FieldName = keyof KanjiFormValues;

const EMPTY_VALUES: KanjiFormValues = {
  character: "",
  strokeCount: "",
  radical: "",
  jlpt: "",
};

const JLPT_OPTIONS = [5, 4, 3, 2, 1];

type KanjiFormProps = {
  initialValues?: KanjiFormValues;
  submitLabel: string;
  submittingLabel: string;
  // Shown when client-side validation fails, e.g. "Thêm mới thất bại! ...".
  invalidMessage: string;
  // Prepended to errors returned by the API, e.g. "Thêm mới thất bại!".
  failurePrefix: string;
  onSubmit: (input: KanjiInput) => Promise<void>;
  onCancel: () => void;
};

function toInput(values: KanjiFormValues) {
  return {
    character: values.character,
    jlpt: values.jlpt ? Number(values.jlpt) : undefined,
    strokeCount: values.strokeCount.trim() ? Number(values.strokeCount) : null,
    radical: values.radical.trim() ? values.radical : null,
  };
}

function KanjiForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  submittingLabel,
  invalidMessage,
  failurePrefix,
  onSubmit,
  onCancel,
}: KanjiFormProps) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const result = kanjiInputSchema.safeParse(toInput(values));

    if (!result.success) {
      const errors: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      setFormError(invalidMessage);
      return;
    }

    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      await onSubmit(result.data);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      setFormError(
        message === CONNECTION_ERROR
          ? CONNECTION_ERROR
          : `${failurePrefix} ${message}`,
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="kanji-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="kanji-form-error" role="alert">
          {formError}
        </p>
      )}

      <label>
        <span>
          Chữ Kanji <em>*</em>
        </span>
        <input
          type="text"
          lang="ja"
          className="kanji-form-character"
          value={values.character}
          onChange={(e) => handleChange("character", e.target.value)}
          placeholder="Ví dụ: 雨"
          maxLength={10}
          aria-invalid={Boolean(fieldErrors.character)}
        />
        {fieldErrors.character && <small>{fieldErrors.character}</small>}
      </label>

      <label>
        <span>Số nét</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={84}
          value={values.strokeCount}
          onChange={(e) => handleChange("strokeCount", e.target.value)}
          placeholder="Ví dụ: 8"
          aria-invalid={Boolean(fieldErrors.strokeCount)}
        />
        {fieldErrors.strokeCount && <small>{fieldErrors.strokeCount}</small>}
      </label>

      <label>
        <span>Bộ thủ</span>
        <input
          type="text"
          lang="ja"
          value={values.radical}
          onChange={(e) => handleChange("radical", e.target.value)}
          placeholder="Ví dụ: 雨"
          maxLength={10}
          aria-invalid={Boolean(fieldErrors.radical)}
        />
        {fieldErrors.radical && <small>{fieldErrors.radical}</small>}
      </label>

      <label>
        <span>
          Cấp độ JLPT <em>*</em>
        </span>
        <select
          value={values.jlpt}
          onChange={(e) => handleChange("jlpt", e.target.value)}
          aria-invalid={Boolean(fieldErrors.jlpt)}
        >
          <option value="">-- Chọn cấp độ --</option>
          {JLPT_OPTIONS.map((level) => (
            <option key={level} value={level}>
              N{level}
            </option>
          ))}
        </select>
        {fieldErrors.jlpt && <small>{fieldErrors.jlpt}</small>}
      </label>

      <div className="kanji-form-actions">
        <button
          type="button"
          className="kanji-button-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </button>
        <button type="submit" className="kanji-button" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default KanjiForm;
