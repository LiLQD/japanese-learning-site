import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import type { GrammarListItem, GrammarListResponse } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import ConfirmDialog from "../../kanji/components/ConfirmDialog";
import {
  deleteGrammar,
  fetchAdminGrammarList,
  GRAMMAR_PAGE_SIZE,
} from "../api";
import GrammarAdminTable from "../components/GrammarAdminTable";
import "./GrammarAdminPage.css";

function GrammarAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const location = useLocation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [data, setData] = useState<GrammarListResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedGrammar, setSelectedGrammar] =
    useState<GrammarListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const [successMessage] = useState(() => {
    const state = location.state as { successMessage?: unknown } | null;
    return typeof state?.successMessage === "string"
      ? state.successMessage
      : "";
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / GRAMMAR_PAGE_SIZE))
    : 1;
  const currentPage = Math.min(page, totalPages);
  const isLoading = loadedKey !== `${currentPage}:${keyword}:${refreshToken}`;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [keywordInput]);

  // Xóa state successMessage khỏi URL sau khi đọc để không bị lặp lại khi F5
  useEffect(() => {
    const state = location.state as { successMessage?: unknown } | null;
    if (typeof state?.successMessage !== "string") return;

    void navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location, navigate]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    const requestKey = `${currentPage}:${keyword}:${refreshToken}`;
    let cancelled = false;
    fetchAdminGrammarList(currentPage, GRAMMAR_PAGE_SIZE, keyword)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setErrorMessage("");
        setLoadedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách ngữ pháp.",
        );
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, currentPage, keyword, refreshToken]);

  async function confirmDelete() {
    if (!selectedGrammar || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteGrammar(selectedGrammar.id);
      setSelectedGrammar(null);
      setActionSuccess("Đã xóa ngữ pháp thành công.");
      setRefreshToken((value) => value + 1);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Không thể xóa dữ liệu ngữ pháp.",
      );
    } finally {
      setIsDeleting(false);
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

  if (!isAdmin) {
    return (
      <main>
        <p>Bạn không có quyền truy cập trang này.</p>
        <Link to="/">Về trang chủ</Link>
      </main>
    );
  }

  return (
    <div className="grammar-admin-layout">
      <Navbar />
      <main className="grammar-admin-main">
        <header className="grammar-admin-header">
          <div>
            <p className="grammar-admin-eyebrow">YUME · QUẢN TRỊ</p>
            <h1>Quản lý ngữ pháp</h1>
            <p>Danh sách dữ liệu ngữ pháp trong hệ thống.</p>
          </div>
          <div className="grammar-admin-total">
            <span>Tổng số ngữ pháp</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
          <Link to="/admin/grammar/create" className="grammar-admin-add-button">
            Thêm ngữ pháp
          </Link>
        </header>

        {errorMessage && <p role="alert">{errorMessage}</p>}
        {successMessage && (
          <p className="grammar-admin-success" role="status">
            {successMessage}
          </p>
        )}
        {actionSuccess && (
          <p className="grammar-admin-success" role="status">
            {actionSuccess}
          </p>
        )}

        <label className="grammar-admin-search">
          Tìm ngữ pháp
          <input
            type="search"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Tên, cấu trúc hoặc ý nghĩa"
          />
        </label>

        {isLoading ? (
          <p role="status">Đang tải danh sách...</p>
        ) : (
          data && (
            <GrammarAdminTable
              grammars={data.grammars}
              page={currentPage}
              pageSize={GRAMMAR_PAGE_SIZE}
              onDelete={(grammar) => {
                setSelectedGrammar(grammar);
                setDeleteError("");
              }}
            />
          )
        )}

        {data && data.total > 0 && (
          <nav className="grammar-admin-pagination" aria-label="Phân trang">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Trang trước
            </button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Trang sau
            </button>
          </nav>
        )}
      </main>
      {selectedGrammar && (
        <ConfirmDialog
          title="Xóa ngữ pháp"
          confirmLabel="Xóa ngữ pháp"
          busyLabel="Đang xóa..."
          isBusy={isDeleting}
          errorMessage={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (!isDeleting) setSelectedGrammar(null);
          }}
        >
          <p>
            Bạn có chắc chắn muốn xóa ngữ pháp{" "}
            <strong>{selectedGrammar.title}</strong> không?
          </p>
          <p>Các ví dụ thuộc ngữ pháp này cũng sẽ bị xóa.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

export default GrammarAdminPage;
