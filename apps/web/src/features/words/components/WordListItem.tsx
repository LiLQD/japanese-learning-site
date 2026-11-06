import { Link } from "react-router";
import type { WordLookup } from "@app/shared";

function getMeanings(word: WordLookup) {
  const meanings = word.senses.flatMap((sense) => sense.meanings);
  return meanings.length > 0 ? meanings.join(" · ") : "Chưa cập nhật thông tin";
}

export default function WordListItem({ word }: { word: WordLookup }) {
  return (
    <Link
      to={`/words/${word.id}`}
      className="word-result-card"
      aria-label={`Xem chi tiết từ ${word.text}`}
    >
      <div className="word-result-main">
        <span className="word-result-text" lang="ja">
          {word.text}
        </span>
        <span className="word-result-reading" lang="ja">
          {word.kana ?? "Chưa cập nhật thông tin"}
        </span>
        <span className="word-result-romaji">
          {word.romaji ?? "Chưa cập nhật thông tin"}
        </span>
      </div>
      <span className="word-result-meaning">{getMeanings(word)}</span>
      <span className="word-result-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
