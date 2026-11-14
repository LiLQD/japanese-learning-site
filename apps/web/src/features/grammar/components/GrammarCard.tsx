import { Link } from "react-router";
import type { GrammarListItem } from "@app/shared";

type GrammarCardProps = {
  grammar: GrammarListItem;
  state?: { page: number };
};

function GrammarCard({ grammar, state }: GrammarCardProps) {
  return (
    <Link
      to={`/grammar/${grammar.id}`}
      state={state}
      className="grammar-card"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="grammar-card-header">
        <h3>{grammar.title}</h3>
        {grammar.jlpt && <span className="jlpt-badge">N{grammar.jlpt}</span>}
      </div>
      <p className="grammar-pattern">{grammar.pattern}</p>
      <p className="grammar-meaning">{grammar.meaning}</p>
    </Link>
  );
}

export default GrammarCard;
