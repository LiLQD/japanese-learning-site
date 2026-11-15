import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import Navbar from "../../../components/Navbar";
import ReadingForm from "../components/ReadingForm";
import {
  fetchReadingDetail,
  updateReading,
  type ReadingDetailResponse,
} from "../api";
import type { ReadingInput } from "@app/shared";

export default function ReadingEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<ReadingInput | null>(null);

  useEffect(() => {
    if (!id) return;

    void fetchReadingDetail(Number(id)).then((res: ReadingDetailResponse) => {
      const r = res.passage;
      setInitialData({
        title: r.title,
        content: r.content,
        translation: r.translation,
        jlpt: r.jlpt,
        questions: [],
      });
    });
  }, [id]);

  const handleUpdate = async (data: ReadingInput) => {
    await updateReading(Number(id), data);
    void navigate("/reading", {
      state: { message: "Cập nhật bài đọc thành công!" },
    });
  };

  if (!initialData) {
    return (
      <div className="reading-layout">
        <Navbar />
        <p style={{ padding: 24 }}>Đang tải dữ liệu bài đọc...</p>
      </div>
    );
  }

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
          <h1>Chỉnh sửa bài đọc</h1>
          <Link to="/reading">Quay lại</Link>
        </div>
        <ReadingForm
          initialValues={initialData}
          submitLabel="Cập nhật"
          submittingLabel="Đang cập nhật..."
          onSubmit={handleUpdate}
          onCancel={() => navigate("/reading")}
        />
      </main>
    </div>
  );
}
