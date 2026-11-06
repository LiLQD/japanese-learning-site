import Navbar from "../../../components/Navbar";
import "./KanjiListPage.css";
import "./KanjiFormPage.css";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import type { KanjiInput, KanjiListItem } from "@app/shared";
import { useAuth } from "../../../contexts/auth-context";
import {
  fetchKanji,
  KANJI_NOT_FOUND as NOT_FOUND_MESSAGE,
  updateKanji,
} from "../api";
import KanjiForm, { type KanjiFormValues } from "../components/KanjiForm";
import type { KanjiEditLocationState } from "../components/KanjiTable";
import type { KanjiListLocationState } from "./KanjiListPage";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function toFormValues(kanji: KanjiListItem): KanjiFormValues {
  return {
    character: kanji.character,
    strokeCount: kanji.strokeCount === null ? "" : String(kanji.strokeCount),
    radical: kanji.radical ?? "",
    jlpt: kanji.jlpt === null ? "" : String(kanji.jlpt),
  };
}

function KanjiEditPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const location = useLocation();
  const { id: idParam } = useParams();
  const id = parseId(idParam);
  const fromPage =
    (location.state as KanjiEditLocationState | null)?.fromPage ?? 1;

  const [kanji, setKanji] = useState<KanjiListItem | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isAdmin || id === null) return;

    let cancelled = false;

    fetchKanji(id)
      .then(({ kanji: result }) => {
        if (cancelled) return;

        setKanji(result);
        setErrorMessage("");
        setLoadedId(id);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setKanji(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải chữ Kanji.",
        );
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isAdmin]);

  function backToList(message?: string) {
    const state: KanjiListLocationState = { page: fromPage, message };
    void navigate("/kanji", { state });
  }

  async function handleSubmit(input: KanjiInput) {
    if (id === null) return;

    await updateKanji(id, input);
    backToList("Cập nhật thành công!");
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

  if (!isAdmin) {
    return (
      <main>
        <p>Bạn không có quyền truy cập trang này.</p>
        <Link to="/kanji">Về danh sách Kanji</Link>
      </main>
    );
  }

  const isLoading = id !== null && loadedId !== id;
  const pageError = id === null ? NOT_FOUND_MESSAGE : errorMessage;

  return (
    <div className="kanji-layout">
      <Navbar />

      <main className="kanji-main">
        <div className="kanji-page-header">
          <div>
            <p className="kanji-eyebrow">YUME · HÁN TỰ</p>
            <h1>Sửa Kanji</h1>
            <p className="kanji-description">
              Các trường có dấu <em>*</em> là bắt buộc.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p>Đang tải chữ Kanji...</p>
        ) : pageError || !kanji ? (
          <>
            <p role="alert">{pageError || NOT_FOUND_MESSAGE}</p>
            <button
              type="button"
              className="kanji-button-secondary"
              onClick={() => backToList()}
            >
              Về danh sách Kanji
            </button>
          </>
        ) : (
          <KanjiForm
            key={kanji.id}
            initialValues={toFormValues(kanji)}
            submitLabel="Cập nhật"
            submittingLabel="Đang cập nhật..."
            invalidMessage="Cập nhật thất bại! Vui lòng kiểm tra lại thông tin!"
            failurePrefix="Cập nhật thất bại!"
            onSubmit={handleSubmit}
            onCancel={() => backToList()}
          />
        )}
      </main>
    </div>
  );
}

export default KanjiEditPage;
