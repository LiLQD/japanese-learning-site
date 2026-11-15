import Navbar from "../../../components/Navbar";
import "./GrammarListPage.css";
import "./GrammarDetailPage.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import type { GrammarExampleItem, GrammarListItem } from "@app/shared";
import { fetchGrammar, fetchGrammarExamples, GRAMMAR_NOT_FOUND } from "../api";
import type { GrammarListLocationState } from "./GrammarListPage";

function parseId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Public page: shows one grammar pattern (US-28) and, on request, its
// example sentences (US-29).
function GrammarDetailPage() {
  const navigate = useNavigate();
  const listState = useLocation().state as GrammarListLocationState | null;
  const id = parseId(useParams().id);

  const [grammar, setGrammar] = useState<GrammarListItem | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Examples are loaded only when the user clicks "Xem ví dụ".
  const [examples, setExamples] = useState<GrammarExampleItem[] | null>(null);
  const [examplesFor, setExamplesFor] = useState<number | null>(null);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [examplesError, setExamplesError] = useState("");

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

  async function handleShowExamples() {
    if (id === null || isLoadingExamples) return;

    setIsLoadingExamples(true);
    setExamplesError("");

    try {
      const result = await fetchGrammarExamples(id);
      setExamples(result.examples);
      setExamplesFor(id);
    } catch (error: unknown) {
      setExamplesError(
        error instanceof Error ? error.message : "Không thể tải ví dụ.",
      );
    } finally {
      setIsLoadingExamples(false);
    }
  }

  function backToList() {
    void navigate("/grammar", { state: listState });
  }

  const isLoading = id !== null && loadedId !== id;
  // Ignore examples that belong to a previously viewed grammar.
  const shownExamples = examplesFor === id ? examples : null;
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

            <section
              className="grammar-examples"
              aria-labelledby="grammar-examples-title"
            >
              <div className="grammar-examples-header">
                <h2 id="grammar-examples-title">Ví dụ</h2>
                {shownExamples === null && (
                  <button
                    type="button"
                    className="grammar-examples-button"
                    onClick={() => void handleShowExamples()}
                    disabled={isLoadingExamples}
                  >
                    {isLoadingExamples ? "Đang tải ví dụ..." : "Xem ví dụ"}
                  </button>
                )}
              </div>

              {examplesError && (
                <p className="grammar-error" role="alert">
                  {examplesError}
                </p>
              )}

              {shownExamples !== null &&
                (shownExamples.length === 0 ? (
                  <p className="grammar-note" role="status">
                    Chưa có ví dụ cho ngữ pháp này
                  </p>
                ) : (
                  <ol className="grammar-example-list">
                    {shownExamples.map((example) => (
                      <li key={example.id}>
                        <p className="grammar-example-japanese" lang="ja">
                          {example.japanese}
                        </p>
                        <p className="grammar-example-vietnamese">
                          {example.vietnamese}
                        </p>
                      </li>
                    ))}
                  </ol>
                ))}
            </section>
          </article>
        )}
      </main>
    </div>
  );
}

export default GrammarDetailPage;
