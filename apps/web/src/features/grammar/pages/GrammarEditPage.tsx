import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { GrammarAdminDetail } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import GrammarForm from "../components/GrammarForm";
import { fetchAdminGrammar, updateGrammar } from "../api";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function GrammarEditPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const id = parseId(useParams().id);
  const [grammar, setGrammar] = useState<GrammarAdminDetail | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isAdmin || id === null) return;

    let cancelled = false;
    fetchAdminGrammar(id)
      .then(({ grammar: result }) => {
        if (cancelled) return;
        setGrammar(result);
        setErrorMessage("");
        setLoadedId(id);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setGrammar(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu ngữ pháp.",
        );
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isAdmin]);

  async function handleSubmit(input: Parameters<typeof updateGrammar>[1]) {
    if (id === null) return;
    await updateGrammar(id, input);
    void navigate("/admin/grammar", {
      state: { successMessage: "Cập nhật ngữ pháp thành công." },
    });
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
        <Link to="/admin/grammar">Về danh sách ngữ pháp</Link>
      </main>
    );
  }

  const isLoading = id !== null && loadedId !== id;
  const pageError = id === null ? "Không tìm thấy ngữ pháp này!" : errorMessage;

  return (
    <div className="grammar-create-layout">
      <Navbar />
      {isLoading ? (
        <main className="grammar-create-main">
          <p role="status">Đang tải dữ liệu ngữ pháp...</p>
        </main>
      ) : pageError || !grammar ? (
        <main className="grammar-create-main">
          <p role="alert">{pageError || "Không tìm thấy ngữ pháp này!"}</p>
          <button
            className="grammar-create-button-secondary"
            type="button"
            onClick={() => void navigate("/admin/grammar")}
          >
            Về danh sách ngữ pháp
          </button>
        </main>
      ) : (
        <GrammarForm
          key={grammar.id}
          mode="edit"
          initialGrammar={grammar}
          onSubmit={handleSubmit}
          onCancel={() => void navigate("/admin/grammar")}
        />
      )}
    </div>
  );
}

export default GrammarEditPage;
