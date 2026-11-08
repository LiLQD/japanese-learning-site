import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import Navbar from "../../../components/Navbar";
import { createWord } from "../api";
import "./WordsPage.css";

export default function WordCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [jlpt, setJlpt] = useState("");
  const [readings, setReadings] = useState([{ kana: "", isPrimary: true }]);
  const [senses, setSenses] = useState([{ partOfSpeech: "", glosses: [""] }]);

  const addReading = () =>
    setReadings([...readings, { kana: "", isPrimary: false }]);
  const removeReading = (index: number) =>
    setReadings(readings.filter((_, i) => i !== index));
  const updateReading = (
    index: number,
    field: string,
    value: string | boolean,
  ) => {
    const newReadings = [...readings];
    newReadings[index] = { ...newReadings[index], [field]: value };
    setReadings(newReadings);
  };

  const addSense = () =>
    setSenses([...senses, { partOfSpeech: "", glosses: [""] }]);
  const removeSense = (index: number) =>
    setSenses(senses.filter((_, i) => i !== index));
  const updateSensePos = (index: number, value: string) => {
    const newSenses = [...senses];
    newSenses[index].partOfSpeech = value;
    setSenses(newSenses);
  };
  const updateGloss = (
    senseIndex: number,
    glossIndex: number,
    value: string,
  ) => {
    const newSenses = [...senses];
    newSenses[senseIndex].glosses[glossIndex] = value;
    setSenses(newSenses);
  };
  const addGloss = (senseIndex: number) => {
    const newSenses = [...senses];
    newSenses[senseIndex].glosses.push("");
    setSenses(newSenses);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        text: text.trim(),
        jlpt: jlpt ? Number(jlpt) : null,
        readings: readings.map((r) => ({
          kana: r.kana.trim(),
          isPrimary: r.isPrimary,
        })),
        senses: senses.map((s, index) => ({
          partOfSpeech: s.partOfSpeech
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          position: index + 1,
          glosses: s.glosses
            .filter((g) => g.trim())
            .map((g) => ({ lang: "vi", text: g.trim() })),
        })),
      };

      await createWord(payload);
      void navigate("/words", {
        state: { message: "Thêm từ vựng thành công!" },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="words-layout">
      <Navbar />
      <main className="words-main" style={{ maxWidth: "800px" }}>
        <div className="words-section-heading">
          <div>
            <p className="words-eyebrow">YUME · QUẢN TRỊ</p>
            <h1>Thêm từ vựng mới</h1>
          </div>
          <Link
            to="/words"
            className="words-pagination"
            style={{ textDecoration: "none" }}
          >
            Quay lại
          </Link>
        </div>

        {error && (
          <div
            className="words-state words-error"
            style={{ color: "red", marginBottom: "16px" }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <fieldset
            style={{
              padding: "20px",
              border: "1px solid var(--color-line)",
              borderRadius: "12px",
            }}
          >
            <legend>Thông tin cơ bản</legend>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
              <label style={{ flex: 2 }}>
                Từ vựng (Kanji/Kana) *
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  style={{ padding: "10px", width: "100%", marginTop: "4px" }}
                />
              </label>
              <label style={{ flex: 1 }}>
                Cấp độ JLPT
                <select
                  value={jlpt}
                  onChange={(e) => setJlpt(e.target.value)}
                  style={{ padding: "10px", width: "100%", marginTop: "4px" }}
                >
                  <option value="">Không có</option>
                  {[5, 4, 3, 2, 1].map((l) => (
                    <option key={l} value={l}>
                      N{l}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset
            style={{
              padding: "20px",
              border: "1px solid var(--color-line)",
              borderRadius: "12px",
            }}
          >
            <legend>Cách đọc (Kana)</legend>
            {readings.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginTop: "12px",
                }}
              >
                <input
                  type="text"
                  value={r.kana}
                  onChange={(e) => updateReading(i, "kana", e.target.value)}
                  placeholder="Ví dụ: にほん"
                  required
                  style={{ padding: "10px", flex: 1 }}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={r.isPrimary}
                    onChange={(e) =>
                      updateReading(i, "isPrimary", e.target.checked)
                    }
                  />{" "}
                  Chính
                </label>
                {readings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReading(i)}
                    style={{
                      color: "red",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addReading}
              style={{ marginTop: "12px", cursor: "pointer" }}
            >
              + Thêm cách đọc
            </button>
          </fieldset>

          <fieldset
            style={{
              padding: "20px",
              border: "1px solid var(--color-line)",
              borderRadius: "12px",
            }}
          >
            <legend>Nghĩa của từ</legend>
            {senses.map((s, i) => (
              <div
                key={i}
                style={{
                  border: "1px dashed #ccc",
                  padding: "16px",
                  marginTop: "12px",
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
                  <span>
                    <strong>Nghĩa {i + 1}</strong>
                  </span>
                  {senses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSense(i)}
                      style={{
                        color: "red",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Xóa nghĩa này
                    </button>
                  )}
                </div>
                <label style={{ display: "block", marginBottom: "8px" }}>
                  Từ loại (VD: n, v1, adj-i)
                  <input
                    type="text"
                    value={s.partOfSpeech}
                    onChange={(e) => updateSensePos(i, e.target.value)}
                    placeholder="n, v1"
                    style={{ padding: "8px", width: "100%", marginTop: "4px" }}
                  />
                </label>
                <div>
                  <span>Bản dịch tiếng Việt:</span>
                  {s.glosses.map((g, gi) => (
                    <input
                      key={gi}
                      type="text"
                      value={g}
                      onChange={(e) => updateGloss(i, gi, e.target.value)}
                      required
                      style={{
                        padding: "8px",
                        width: "100%",
                        marginTop: "4px",
                        marginBottom: "4px",
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addGloss(i)}
                    style={{
                      fontSize: "12px",
                      background: "none",
                      border: "none",
                      color: "var(--color-brand)",
                      cursor: "pointer",
                    }}
                  >
                    + Thêm bản dịch khác
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSense}
              style={{ marginTop: "12px", cursor: "pointer" }}
            >
              + Thêm nghĩa mới
            </button>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "16px",
              fontSize: "16px",
              background: "var(--color-brand)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu từ vựng"}
          </button>
        </form>
      </main>
    </div>
  );
}
