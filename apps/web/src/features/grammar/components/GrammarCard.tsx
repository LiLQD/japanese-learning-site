import { Link } from "react-router";
import type { GrammarListItem } from "@app/shared";

// Remembered by the detail page so "Quay lại danh sách" restores the list.
export type GrammarListLocationState = {
  page?: number;
};

type GrammarCardProps = {
  grammar: GrammarListItem;
  listState?: GrammarListLocationState;
};

function GrammarCard({ grammar, listState }: GrammarCardProps) {
  return (
    <Link
      to={`/grammar/${grammar.id}`}
      state={listState}
      className="grammar-card"
    >
      <div className="grammar-card-top">
        <h2 className="grammar-pattern" lang="ja">
          {grammar.pattern}
        </h2>
        {grammar.jlpt && (
          <span className={`grammar-jlpt grammar-jlpt-n${grammar.jlpt}`}>
            N{grammar.jlpt}
          </span>
        )}
      </div>
      <p className="grammar-title">{grammar.title}</p>
      <p className="grammar-meaning">{grammar.meaning}</p>
    </Link>
  );
}

export default GrammarCard;
