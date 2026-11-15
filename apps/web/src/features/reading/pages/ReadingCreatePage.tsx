import { useNavigate, Link } from "react-router";
import Navbar from "../../../components/Navbar";
import ReadingForm from "../components/ReadingForm";
import type { ReadingInput } from "@app/shared";
import { createReading } from "../api";

export default function ReadingCreatePage() {
  const navigate = useNavigate();

  const handleCreate = async (data: ReadingInput) => {
    await createReading(data);
    void navigate("/reading", {
      state: { message: "Thêm bài đọc thành công!" },
    });
  };

  return (
    <div className="reading-layout">
      <Navbar />
      <main className="reading-main" style={{ maxWidth: "800px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <h1>Thêm bài đọc mới</h1>
          <Link to="/reading">Quay lại</Link>
        </div>
        <ReadingForm
          submitLabel="Lưu bài đọc"
          submittingLabel="Đang lưu..."
          onSubmit={handleCreate}
          onCancel={() => navigate("/reading")}
        />
      </main>
    </div>
  );
}
