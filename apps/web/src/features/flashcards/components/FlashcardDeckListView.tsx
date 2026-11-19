import type { FlashcardDeckListItem } from "@app/shared";

type FlashcardDeckListViewProps = {
  decks: FlashcardDeckListItem[] | null;
  isLoading: boolean;
  errorMessage: string;
  selectedDeckId: number | null;
  onRetry: () => void;
  onSelectDeck: (deckId: number) => void;
};

function FlashcardDeckListView({
  decks,
  isLoading,
  errorMessage,
  selectedDeckId,
  onRetry,
  onSelectDeck,
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
        <button
          type="button"
          className="flashcard-create-button"
          disabled
          title="Chức năng tạo bộ flashcard chưa khả dụng."
        >
          Tạo bộ flashcard mới
        </button>
      </section>
    );
  }

  const sharedDecks = decks.filter((deck) => deck.visibility === "SHARED");
  const personalDecks = decks.filter((deck) => deck.visibility === "PERSONAL");
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

  const renderDeck = (deck: FlashcardDeckListItem) => {
    const isSelected = deck.id === selectedDeckId;

    return (
      <li key={deck.id}>
        <button
          type="button"
          className={`flashcard-deck-card${isSelected ? " selected" : ""}`}
          aria-pressed={isSelected}
          onClick={() => onSelectDeck(deck.id)}
        >
          <span className="flashcard-deck-card-heading">{deck.name}</span>
          {deck.visibility === "SHARED" && (
            <span className="flashcard-deck-visibility">Dùng chung</span>
          )}
          {deck.description && (
            <span className="flashcard-deck-description">
              {deck.description}
            </span>
          )}
          <span className="flashcard-deck-count">{deck.cardCount} thẻ</span>
        </button>
      </li>
    );
  };

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
            <button
              type="button"
              className="flashcard-create-button"
              disabled
              title="Chức năng tạo bộ flashcard chưa khả dụng."
            >
              Tạo bộ flashcard mới
            </button>
          </div>
        )}
      </section>
      {selectedDeck && (
        <p className="flashcard-selection-status" role="status">
          Đã chọn bộ flashcard: {selectedDeck.name}
        </p>
      )}
    </>
  );
}

export default FlashcardDeckListView;
