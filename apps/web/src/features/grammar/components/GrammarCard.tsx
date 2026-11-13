import type { GrammarListItem } from "@app/shared";

type GrammarCardProps = {
  grammar: GrammarListItem;
};

function GrammarCard({ grammar }: GrammarCardProps) {
  return (
    <article className="grammar-card">
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
    </article>
  );
}

export default GrammarCard;
