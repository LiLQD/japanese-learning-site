import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { GrammarAdminDetail } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import { fetchAdminGrammar, GRAMMAR_NOT_FOUND } from "../api";
import "./GrammarListPage.css";
import "./GrammarDetailPage.css";
import "./GrammarAdminPage.css";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function GrammarAdminDetailPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const id = parseId(useParams().id);
  const [grammar, setGrammar] = useState<GrammarAdminDetail | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user?.role !== "ADMIN" || id === null) return;

    let cancelled = false;
    fetchAdminGrammar(id)
      .then((response) => {
        if (cancelled) return;
        setGrammar(response.grammar);
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
  }, [id, user?.role]);

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
        <Link to="/">Về trang chủ</Link>
      </main>
    );
  }

  const isLoading = id !== null && loadedId !== id;
  const pageError = id === null ? GRAMMAR_NOT_FOUND : errorMessage;
  const jlpt = grammar?.jlpt;
  const jlptLabel =
    jlpt === null
      ? "Chưa phân loại"
      : jlpt !== undefined && Number.isInteger(jlpt) && jlpt >= 1 && jlpt <= 5
        ? `N${jlpt}`
        : "—";

  return (
    <div className="grammar-layout">
      <Navbar />
      <main className="grammar-main">
        <Link className="grammar-back" to="/admin/grammar">
          ← Quay lại danh sách
        </Link>

        {isLoading ? (
          <p className="grammar-note" role="status">
            Đang tải ngữ pháp...
          </p>
        ) : pageError || !grammar ? (
          <p className="grammar-error" role="alert">
            {pageError || GRAMMAR_NOT_FOUND}
          </p>
        ) : (
          <article className="grammar-detail grammar-admin-detail">
            <div className="grammar-admin-detail-heading">
              <div>
                <p className="grammar-eyebrow">YUME · QUẢN TRỊ NGỮ PHÁP</p>
                <h1>{grammar.title}</h1>
              </div>
              <Link
                className="grammar-admin-add-button"
                to={`/admin/grammar/${grammar.id}/edit`}
              >
                Sửa ngữ pháp
              </Link>
            </div>

            <dl className="grammar-detail-fields">
              <div>
                <dt>Mã ngữ pháp</dt>
                <dd>{grammar.id}</dd>
              </div>
              <div>
                <dt>Cấu trúc ngữ pháp</dt>
                <dd lang="ja">{grammar.pattern}</dd>
              </div>
              <div>
                <dt>Ý nghĩa</dt>
                <dd>{grammar.meaning}</dd>
              </div>
              <div>
                <dt>Cấp độ JLPT</dt>
                <dd>{jlptLabel}</dd>
              </div>
            </dl>

            <section
              className="grammar-admin-examples"
              aria-labelledby="grammar-examples-title"
            >
              <h2 id="grammar-examples-title">Ví dụ minh họa</h2>
              {grammar.examples.length === 0 ? (
                <p>Chưa có ví dụ.</p>
              ) : (
                <ol>
                  {grammar.examples.map((example) => (
                    <li key={example.id}>
                      <p lang="ja">{example.japanese}</p>
                      {example.reading && (
                        <p lang="ja">Cách đọc: {example.reading}</p>
                      )}
                      <p>Bản dịch tiếng Việt: {example.vietnamese}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </article>
        )}
      </main>
    </div>
  );
}

export default GrammarAdminDetailPage;
