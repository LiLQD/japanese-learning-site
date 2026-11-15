import { Link, useNavigate } from "react-router";
import type { GrammarCreateInput } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import GrammarForm from "../components/GrammarForm";
import { createGrammar } from "../api";

function GrammarCreatePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(input: GrammarCreateInput) {
    await createGrammar(input);
    void navigate("/admin/grammar", {
      state: { successMessage: "Thêm ngữ pháp thành công." },
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
      <GrammarForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => void navigate("/admin/grammar")}
      />
    </div>
  );
}

export default GrammarCreatePage;
