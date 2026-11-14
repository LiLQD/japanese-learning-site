import Navbar from "../../../components/Navbar";
import "./GrammarListPage.css";
import "./GrammarDetailPage.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import type { GrammarListItem } from "@app/shared";
import { fetchGrammar, GRAMMAR_NOT_FOUND } from "../api";
import type { GrammarListLocationState } from "./GrammarListPage";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Public page: shows one grammar pattern (US-28).
function GrammarDetailPage() {
  const navigate = useNavigate();
  const listState = useLocation().state as GrammarListLocationState | null;
  const id = parseId(useParams().id);

  const [grammar, setGrammar] = useState<GrammarListItem | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (id === null) return;

    let cancelled = false;

    fetchGrammar(id)
      .then((result) => {
        if (cancelled) return;

        setGrammar(result.grammar);
        setErrorMessage("");
        setLoadedId(id);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setGrammar(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải ngữ pháp.",
        );
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function backToList() {
    void navigate("/grammar", { state: listState });
  }

  const isLoading = id !== null && loadedId !== id;
  const pageError = id === null ? GRAMMAR_NOT_FOUND : errorMessage;

  return (
    <div className="grammar-layout">
      <Navbar />

      <main className="grammar-main">
        <button type="button" className="grammar-back" onClick={backToList}>
          ← Quay lại danh sách
        </button>

        {isLoading ? (
          <p className="grammar-note">Đang tải ngữ pháp...</p>
        ) : pageError || !grammar ? (
          <p className="grammar-error" role="alert">
            {pageError || GRAMMAR_NOT_FOUND}
          </p>
        ) : (
          <article className="grammar-detail">
            <p className="grammar-eyebrow">YUME · NGỮ PHÁP</p>

            <div className="grammar-detail-top">
              <h1 className="grammar-detail-pattern" lang="ja">
                {grammar.pattern}
              </h1>
              {grammar.jlpt && (
                <span className={`grammar-jlpt grammar-jlpt-n${grammar.jlpt}`}>
                  N{grammar.jlpt}
                </span>
              )}
            </div>

            <dl className="grammar-detail-fields">
              <div>
                <dt>Tên ngữ pháp</dt>
                <dd>{grammar.title}</dd>
              </div>
              <div>
                <dt>Ý nghĩa</dt>
                <dd>{grammar.meaning}</dd>
              </div>
            </dl>
          </article>
        )}
      </main>
    </div>
  );
}

export default GrammarDetailPage;
