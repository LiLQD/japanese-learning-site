import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { WordLookup } from "@app/shared";
import Navbar from "../../../components/Navbar";
import { fetchWord } from "../api";
import "./WordsPage.css";

const NOT_FOUND_MESSAGE = "Không tìm thấy từ vựng phù hợp";
const NOT_UPDATED_MESSAGE = "Chưa cập nhật thông tin";

function getJlptLabel(jlpt: number | null) {
  if (
    typeof jlpt !== "number" ||
    !Number.isInteger(jlpt) ||
    jlpt < 1 ||
    jlpt > 5
  ) {
    return NOT_UPDATED_MESSAGE;
  }

  return `N${6 - jlpt}`;
}

function WordDetailPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const isValidId = Number.isInteger(id) && id > 0;
  const [word, setWord] = useState<WordLookup | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoading = isValidId && loadedId !== id;

  useEffect(() => {
    if (!isValidId) return;

    let cancelled = false;

    fetchWord(id)
      .then((result) => {
        if (cancelled) return;
        setWord(result.word);
        setErrorMessage("");
        setLoadedId(id);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWord(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin từ vựng.",
        );
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isValidId]);

  return (
    <div className="words-layout">
      <Navbar />

      <main className="words-main words-detail-main">
        <Link to="/words" className="words-back-link">
          <span aria-hidden="true">←</span> Quay lại tra cứu
        </Link>

        {isLoading ? (
          <div className="words-state words-detail-state" role="status">
            <span className="words-spinner" aria-hidden="true" />
            Đang tải chi tiết từ vựng...
          </div>
        ) : !isValidId ? (
          <div className="words-state words-error" role="alert">
            {NOT_FOUND_MESSAGE}
          </div>
        ) : errorMessage ? (
          <div className="words-state words-error" role="alert">
            {errorMessage === NOT_FOUND_MESSAGE
              ? NOT_FOUND_MESSAGE
              : errorMessage}
          </div>
        ) : word ? (
          <article className="word-detail-card">
            <header className="word-detail-header">
              <div>
                <p className="words-eyebrow">CHI TIẾT TỪ VỰNG</p>
                <h1 className="word-detail-title" lang="ja">
                  {word.text}
                </h1>
                <p className="word-detail-reading" lang="ja">
                  {word.kana ?? NOT_UPDATED_MESSAGE}
                </p>
                <p className="word-detail-romaji">
                  {word.romaji ?? NOT_UPDATED_MESSAGE}
                </p>
                <div className="word-detail-jlpt">
                  <span>Cấp độ JLPT</span>
                  <strong>{getJlptLabel(word.jlpt)}</strong>
                </div>
              </div>
              <span className="word-detail-kanji" lang="ja" aria-hidden="true">
                語
              </span>
            </header>

            <section
              className="word-detail-senses"
              aria-labelledby="word-meanings"
            >
              <div className="word-detail-section-title">
                <span className="word-detail-section-number">01</span>
                <h2 id="word-meanings">Từ loại &amp; nghĩa</h2>
              </div>

              {word.senses.length === 0 ? (
                <p className="word-detail-missing">{NOT_UPDATED_MESSAGE}</p>
              ) : (
                <ol className="word-sense-list">
                  {word.senses.map((sense, index) => (
                    <li
                      key={`${sense.position}-${index}`}
                      className="word-sense"
                    >
                      <div className="word-sense-meta">
                        <span className="word-sense-position">
                          Nghĩa {sense.position}
                        </span>
                        {sense.partOfSpeech.length > 0 ? (
                          <div className="word-pos-list">
                            {sense.partOfSpeech.map((partOfSpeech, index) => (
                              <span
                                className="word-pos-tag"
                                key={`${partOfSpeech}-${index}`}
                              >
                                {partOfSpeech}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="word-detail-missing">
                            {NOT_UPDATED_MESSAGE}
                          </span>
                        )}
                      </div>

                      {sense.meanings.length > 0 ? (
                        <ul className="word-meaning-list">
                          {sense.meanings.map((meaning, index) => (
                            <li key={`${meaning}-${index}`}>{meaning}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="word-detail-missing">
                          {NOT_UPDATED_MESSAGE}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </article>
        ) : (
          <div className="words-state words-error" role="alert">
            {NOT_FOUND_MESSAGE}
          </div>
        )}
      </main>
    </div>
  );
}

export default WordDetailPage;
