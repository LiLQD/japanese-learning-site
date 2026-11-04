import Navbar from "../../../components/Navbar";
import "./KanjiListPage.css";
import "./KanjiFormPage.css";
import { Link, useNavigate } from "react-router";
import type { KanjiInput } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import { createKanji, fetchKanjiList, KANJI_PAGE_SIZE } from "../api";
import KanjiForm from "../components/KanjiForm";
import type { KanjiListLocationState } from "./KanjiListPage";

function KanjiCreatePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(input: KanjiInput) {
    await createKanji(input);

    // New kanji get the highest id, so they show up on the last page.
    let lastPage = 1;
    try {
      const { total } = await fetchKanjiList(1, 1);
      lastPage = Math.max(1, Math.ceil(total / KANJI_PAGE_SIZE));
    } catch {
      // The kanji is already saved; fall back to the first page.
    }

    const state: KanjiListLocationState = {
      message: "Thêm mới thành công!",
      page: lastPage,
    };
    void navigate("/kanji", { state });
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
        <Link to="/kanji">Về danh sách Kanji</Link>
      </main>
    );
  }

  return (
    <div className="kanji-layout">
      <Navbar />

      <main className="kanji-main">
        <div className="kanji-page-header">
          <div>
            <p className="kanji-eyebrow">YUME · HÁN TỰ</p>
            <h1>Thêm mới Kanji</h1>
            <p className="kanji-description">
              Các trường có dấu <em>*</em> là bắt buộc.
            </p>
          </div>
        </div>

        <KanjiForm
          submitLabel="Lưu"
          submittingLabel="Đang lưu..."
          invalidMessage="Thêm mới thất bại! Vui lòng điền đầy đủ thông tin hợp lệ!"
          failurePrefix="Thêm mới thất bại!"
          onSubmit={handleSubmit}
          onCancel={() => void navigate("/kanji")}
        />
      </main>
    </div>
  );
}

export default KanjiCreatePage;
