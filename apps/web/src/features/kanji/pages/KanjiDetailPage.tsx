import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import type { KanjiDetail } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { fetchKanjiDetail, KANJI_NOT_FOUND } from "../api";
import "./KanjiDetailPage.css";

type KanjiDetailLocationState = {
  page?: number;
};

const NOT_UPDATED = "Chưa cập nhật";

function getJlptLabel(jlpt: number | null) {
  return typeof jlpt === "number" &&
    Number.isInteger(jlpt) &&
    jlpt >= 1 &&
    jlpt <= 5
    ? `N${jlpt}`
    : NOT_UPDATED;
}

function KanjiDetailSkeleton() {
  return (
    <div className="kanji-detail-skeleton" aria-label="Đang tải chi tiết Kanji">
      <div className="kanji-detail-skeleton-hero">
        <div className="kanji-skeleton kanji-skeleton-kicker" />
        <div className="kanji-skeleton kanji-skeleton-character" />
        <div className="kanji-skeleton kanji-skeleton-caption" />
        <div className="kanji-detail-skeleton-facts">
          {[0, 1, 2, 3].map((item) => (
            <div className="kanji-detail-skeleton-fact" key={item}>
              <div className="kanji-skeleton kanji-skeleton-label" />
              <div className="kanji-skeleton kanji-skeleton-value" />
            </div>
          ))}
        </div>
      </div>
      <div className="kanji-detail-skeleton-section">
        <div className="kanji-skeleton kanji-skeleton-heading" />
        {[0, 1, 2].map((item) => (
          <div className="kanji-skeleton kanji-skeleton-word" key={item} />
        ))}
      </div>
    </div>
  );
}

function KanjiFacts({ kanji }: { kanji: KanjiDetail }) {
  const facts = [
    {
      label: "Số nét",
      value: kanji.strokeCount ?? NOT_UPDATED,
      detail: "Nét viết",
    },
    { label: "Bộ thủ", value: kanji.radical ?? NOT_UPDATED, detail: "Radical" },
    {
      label: "Cấp độ JLPT",
      value: getJlptLabel(kanji.jlpt),
      detail: "Năng lực tiếng Nhật",
    },
    {
      label: "Cấp lớp",
      value: kanji.grade === null ? NOT_UPDATED : `Lớp ${kanji.grade}`,
      detail: "Giáo dục Nhật Bản",
    },
  ];

  return (
    <dl className="kanji-detail-facts">
      {facts.map((fact) => (
        <div className="kanji-detail-fact" key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
          <span>{fact.detail}</span>
        </div>
      ))}
    </dl>
  );
}

function KanjiWordCard({
  word,
  index,
}: {
  word: KanjiDetail["words"][number];
  index: number;
}) {
  return (
    <Link
      className="kanji-word-card"
      to={`/words/${word.id}`}
      aria-label={`Xem từ ${word.text} trong từ điển`}
    >
      <span className="kanji-word-index">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="kanji-word-main">
        <strong className="kanji-word-text" lang="ja">
          {word.text}
        </strong>
        <span className="kanji-word-readings" lang="ja">
          {word.readings.length > 0 ? word.readings.join(" · ") : NOT_UPDATED}
        </span>
      </span>
      <span className="kanji-word-meaning">
        {word.meanings.length > 0 ? word.meanings.join(" · ") : NOT_UPDATED}
      </span>
      <span className="kanji-word-meta">
        {getJlptLabel(word.jlpt) !== NOT_UPDATED && (
          <span className="kanji-word-jlpt">{getJlptLabel(word.jlpt)}</span>
        )}
        <span className="kanji-word-arrow" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

function KanjiDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const isValidId = Number.isInteger(id) && id > 0;
  const location = useLocation();
  const locationState = location.state as KanjiDetailLocationState | null;
  const listPage =
    locationState?.page && locationState.page > 0 ? locationState.page : 1;
  const [kanji, setKanji] = useState<KanjiDetail | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${id}:${retryCount}`;
  const isLoading = isValidId && loadedKey !== requestKey;
  const isNotFound = !isValidId || errorMessage === KANJI_NOT_FOUND;

  useEffect(() => {
    if (!isValidId) return;

    let cancelled = false;

    fetchKanjiDetail(id)
      .then(({ kanji: result }) => {
        if (cancelled) return;
        setKanji(result);
        setErrorMessage("");
        setLoadedKey(requestKey);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setKanji(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải chi tiết Kanji.",
        );
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isValidId, requestKey]);

  return (
    <div className="kanji-detail-layout">
      <Navbar />

      <main className="kanji-detail-main">
        <nav className="kanji-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <Link to="/kanji" state={{ page: listPage }}>
            Kanji
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Chi tiết Kanji</span>
        </nav>

        <Link
          to="/kanji"
          state={{ page: listPage }}
          className="kanji-detail-back"
        >
          <span aria-hidden="true">←</span>
          Quay lại danh sách Kanji
        </Link>

        {isLoading ? (
          <KanjiDetailSkeleton />
        ) : isNotFound ? (
          <section className="kanji-detail-state" role="alert">
            <span className="kanji-detail-state-mark" aria-hidden="true">
              字
            </span>
            <p className="kanji-detail-eyebrow">KHÔNG TÌM THẤY</p>
            <h1>Kanji này không tồn tại</h1>
            <p>Hãy quay lại danh sách để chọn một chữ Kanji khác.</p>
            <Link
              to="/kanji"
              state={{ page: listPage }}
              className="kanji-detail-primary"
            >
              Về danh sách Kanji
            </Link>
          </section>
        ) : errorMessage ? (
          <section
            className="kanji-detail-state kanji-detail-error"
            role="alert"
          >
            <span className="kanji-detail-state-mark" aria-hidden="true">
              !
            </span>
            <p className="kanji-detail-eyebrow">ĐÃ XẢY RA LỖI</p>
            <h1>Chưa thể tải chi tiết Kanji</h1>
            <p>{errorMessage}</p>
            <button
              type="button"
              className="kanji-detail-primary"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Thử tải lại
            </button>
          </section>
        ) : kanji ? (
          <>
            <section
              className="kanji-detail-hero"
              aria-labelledby="kanji-title"
            >
              <div className="kanji-detail-hero-copy">
                <p className="kanji-detail-eyebrow">YUME · HÁN TỰ</p>
                <h1 id="kanji-title" className="kanji-detail-heading">
                  Chi tiết Kanji
                </h1>
                <p className="kanji-detail-intro">
                  Khám phá chữ viết và những từ vựng có chứa chữ này.
                </p>
                <KanjiFacts kanji={kanji} />
              </div>
              <div className="kanji-detail-character-panel">
                <span className="kanji-detail-character-caption">HÁN TỰ</span>
                <span className="kanji-detail-character" lang="ja">
                  {kanji.character}
                </span>
                <span className="kanji-detail-character-id">
                  KANJI · {String(kanji.id).padStart(3, "0")}
                </span>
              </div>
            </section>

            <section
              className="kanji-detail-words"
              aria-labelledby="kanji-words-title"
            >
              <div className="kanji-detail-section-heading">
                <div>
                  <p className="kanji-detail-eyebrow">MỞ RỘNG VỐN TỪ</p>
                  <h2 id="kanji-words-title">Từ vựng chứa Kanji này</h2>
                  <p>
                    {kanji.words.length > 0
                      ? `${kanji.words.length} từ vựng liên quan`
                      : "Các từ có chứa chữ này sẽ xuất hiện tại đây."}
                  </p>
                </div>
                <span className="kanji-detail-section-count">
                  {String(kanji.words.length).padStart(2, "0")}
                  <small>TỪ</small>
                </span>
              </div>

              {kanji.words.length === 0 ? (
                <div className="kanji-detail-empty" role="status">
                  <span className="kanji-detail-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none">
                      <path
                        d="M9 10.5c5.8-1.6 10.8-.8 15 2.2v25c-4.2-3-9.2-3.8-15-2.2v-25Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M39 10.5c-5.8-1.6-10.8-.8-15 2.2v25c4.2-3 9.2-3.8 15-2.2v-25Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 17c2.2-.3 4.1.1 6 1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M33 17c-2.2-.3-4.1.1-6 1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <h3>Chưa có từ vựng liên quan đến Kanji này.</h3>
                  <p>Danh sách sẽ được cập nhật khi có thêm từ vựng phù hợp.</p>
                </div>
              ) : (
                <div className="kanji-detail-word-list">
                  {kanji.words.map((word, index) => (
                    <KanjiWordCard key={word.id} word={word} index={index} />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default KanjiDetailPage;
