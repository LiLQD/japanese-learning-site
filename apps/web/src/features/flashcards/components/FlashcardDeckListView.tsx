import type { FlashcardDeckListItem } from "@app/shared";
import { Link } from "react-router";

type FlashcardDeckListViewProps = {
  decks: FlashcardDeckListItem[] | null;
  isLoading: boolean;
  errorMessage: string;
  onRetry: () => void;
};

function renderDeck(deck: FlashcardDeckListItem) {
  return (
    <li key={deck.id}>
      <Link to={`/flashcards/${deck.id}`} className="flashcard-deck-card">
        <span className="flashcard-deck-card-heading">{deck.name}</span>
        {deck.visibility === "SHARED" && (
          <span className="flashcard-deck-visibility">Dùng chung</span>
        )}
        {deck.description && (
          <span className="flashcard-deck-description">{deck.description}</span>
        )}
        <span className="flashcard-deck-count">{deck.cardCount} thẻ</span>
        <span className="flashcard-deck-open">Mở bộ thẻ</span>
      </Link>
    </li>
  );
}

function FlashcardDeckListView({
  decks,
  isLoading,
  errorMessage,
  onRetry,
}: FlashcardDeckListViewProps) {
  if (isLoading) {
    return (
      <p className="flashcard-note" role="status">
        Đang tải danh sách bộ flashcard...
      </p>
    );
  }

  if (errorMessage) {
    return (
      <div className="flashcard-error" role="alert">
        <p>{errorMessage}</p>
        <button type="button" onClick={onRetry}>
          Thử tải lại
        </button>
      </div>
    );
  }

  if (!decks || decks.length === 0) {
    return (
      <section className="flashcard-empty">
        <p role="status">Bạn chưa có bộ flashcard nào</p>
      </section>
    );
  }

  const sharedDecks = decks.filter((deck) => deck.visibility === "SHARED");
  const personalDecks = decks.filter((deck) => deck.visibility === "PERSONAL");

  return (
    <>
      <section className="flashcard-deck-section">
        <h2>Bộ flashcard mẫu</h2>
        {sharedDecks.length > 0 ? (
          <ul className="flashcard-deck-list">{sharedDecks.map(renderDeck)}</ul>
        ) : (
          <p className="flashcard-note">Chưa có bộ flashcard mẫu.</p>
        )}
      </section>
      <section className="flashcard-deck-section">
        <h2>Bộ flashcard của tôi</h2>
        {personalDecks.length > 0 ? (
          <ul className="flashcard-deck-list">
            {personalDecks.map(renderDeck)}
          </ul>
        ) : (
          <div className="flashcard-personal-empty">
            <p role="status">Bạn chưa có bộ flashcard cá nhân nào</p>
          </div>
        )}
      </section>
    </>
  );
}

export default FlashcardDeckListView;
