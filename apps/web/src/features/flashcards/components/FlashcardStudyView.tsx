import type { Dispatch } from "react";
import type { FlashcardDeckDetail } from "@app/shared";
import { Link } from "react-router";
import {
  getFlashcardsToReview,
  getFlashcardReviewSummary,
  type FlashcardStudyAction,
  type FlashcardStudyState,
} from "../learning-session";

type FlashcardStudyViewProps = {
  deck: FlashcardDeckDetail;
  state: FlashcardStudyState;
  dispatch: Dispatch<FlashcardStudyAction>;
  onExit: () => void;
};

function contentSizeClass(content: string) {
  const length = Array.from(content).length;
  if (length >= 220) return "is-very-long";
  if (length >= 80) return "is-long";
  return "";
}

function FlashcardStudyView({
  deck,
  state,
  dispatch,
  onExit,
}: FlashcardStudyViewProps) {
  if (deck.cards.length === 0) {
    return (
      <section className="flashcard-study-empty" aria-labelledby="study-title">
        <h1 id="study-title">{deck.name}</h1>
        <p role="status">Bộ flashcard này chưa có thẻ từ vựng nào</p>
        <Link to="/flashcards" className="flashcard-study-button">
          Quay lại chọn bộ thẻ
        </Link>
      </section>
    );
  }

  const summary = getFlashcardReviewSummary(deck.cards, state.reviewStatuses);
  const reviewCards = getFlashcardsToReview(deck.cards, state.reviewStatuses);

  if (state.phase === "SUMMARY" || state.phase === "REVIEW_COMPLETE") {
    return (
      <section
        className="flashcard-study-summary"
        aria-labelledby="study-title"
      >
        <h1 id="study-title">
          {state.phase === "SUMMARY"
            ? "Tổng kết phiên học"
            : "Đã hoàn thành ôn tập"}
        </h1>
        <p className="flashcard-study-deck-name">{deck.name}</p>
        <dl className="flashcard-study-counts">
          <div>
            <dt>Đã học</dt>
            <dd>{summary.total}</dd>
          </div>
          <div>
            <dt>Nhớ</dt>
            <dd>{summary.remembered}</dd>
          </div>
          <div>
            <dt>Chưa nhớ</dt>
            <dd>{summary.needsReview}</dd>
          </div>
          <div>
            <dt>Chưa đánh giá</dt>
            <dd>{summary.unanswered}</dd>
          </div>
        </dl>
        {state.phase === "REVIEW_COMPLETE" ? (
          <p role="status">Đã hoàn thành ôn tập {reviewCards.length} thẻ.</p>
        ) : reviewCards.length > 0 ? (
          <button
            type="button"
            className="flashcard-study-button"
            onClick={() =>
              dispatch({
                type: "START_REVIEW",
                reviewCount: reviewCards.length,
              })
            }
          >
            Ôn tập flashcard ({reviewCards.length})
          </button>
        ) : (
          <p role="status">Không có thẻ nào cần ôn tập.</p>
        )}
        <button
          type="button"
          className="flashcard-study-secondary"
          onClick={onExit}
        >
          Kết thúc phiên học
        </button>
      </section>
    );
  }

  const isReviewing = state.phase === "REVIEWING";
  const cards = isReviewing ? reviewCards : deck.cards;
  const card = cards[state.currentIndex];

  if (!card) {
    return (
      <section
        className="flashcard-study-summary"
        aria-labelledby="study-title"
      >
        <h1 id="study-title">Không có thẻ nào cần ôn tập.</h1>
        <button
          type="button"
          className="flashcard-study-secondary"
          onClick={onExit}
        >
          Kết thúc phiên học
        </button>
      </section>
    );
  }

  const currentPosition = state.currentIndex + 1;
  const canGoBack = state.currentIndex > 0;
  const isLastCard = currentPosition === cards.length;
  const status = state.reviewStatuses[card.id];

  return (
    <section className="flashcard-study" aria-labelledby="study-title">
      <div className="flashcard-study-heading">
        <div>
          <p className="flashcard-eyebrow">
            {isReviewing ? "ÔN TẬP FLASHCARD" : "HỌC FLASHCARD"}
          </p>
          <h1 id="study-title">{deck.name}</h1>
        </div>
        <button type="button" className="flashcard-study-exit" onClick={onExit}>
          Thoát phiên học
        </button>
      </div>

      <div className="flashcard-study-progress-row">
        <span>
          Thẻ {currentPosition} / {cards.length}
        </span>
        <span>
          {isReviewing
            ? "Thẻ cần ôn"
            : status
              ? status === "REMEMBERED"
                ? "Đã chọn: Nhớ"
                : "Đã chọn: Chưa nhớ"
              : "Chưa đánh giá"}
        </span>
      </div>
      <progress
        className="flashcard-study-progress"
        value={currentPosition}
        max={cards.length}
        aria-label="Tiến độ học"
        role="progressbar"
      />

      <button
        type="button"
        className={`flashcard-study-card${state.answerVisible ? " is-flipped" : ""}`}
        aria-label={state.answerVisible ? "Ẩn đáp án" : "Xem đáp án"}
        aria-pressed={state.answerVisible}
        onClick={() =>
          dispatch({
            type: state.answerVisible ? "HIDE_ANSWER" : "SHOW_ANSWER",
          })
        }
      >
        <span className="flashcard-study-side-label">
          {state.answerVisible ? "Mặt sau" : "Mặt trước"}
        </span>
        <span className="flashcard-study-flip-inner" aria-live="polite">
          <span
            className={`flashcard-study-card-content flashcard-study-front-face ${contentSizeClass(card.front)}`.trim()}
            aria-hidden={state.answerVisible}
          >
            {card.front}
          </span>
          {state.answerVisible && (
            <span
              className={`flashcard-study-card-content flashcard-study-back-face ${contentSizeClass(card.back)}`.trim()}
            >
              {card.back}
            </span>
          )}
        </span>
        <span className="flashcard-study-flip-hint">
          {state.answerVisible ? "Nhấn để xem mặt trước" : "Nhấn để xem đáp án"}
        </span>
      </button>

      {state.answerVisible && !isReviewing && (
        <div className="flashcard-study-rating" aria-label="Đánh giá flashcard">
          <button
            type="button"
            className={status === "REMEMBERED" ? "is-selected" : ""}
            aria-pressed={status === "REMEMBERED"}
            onClick={() =>
              dispatch({
                type: "RATE_CARD",
                cardId: card.id,
                status: "REMEMBERED",
              })
            }
          >
            Nhớ
          </button>
          <button
            type="button"
            className={status === "NEEDS_REVIEW" ? "is-selected" : ""}
            aria-pressed={status === "NEEDS_REVIEW"}
            onClick={() =>
              dispatch({
                type: "RATE_CARD",
                cardId: card.id,
                status: "NEEDS_REVIEW",
              })
            }
          >
            Chưa nhớ
          </button>
        </div>
      )}

      <nav
        className="flashcard-study-navigation"
        aria-label="Điều khiển phiên học"
      >
        {canGoBack && (
          <button
            type="button"
            className="flashcard-study-secondary"
            onClick={() =>
              dispatch({
                type: isReviewing ? "PREVIOUS_REVIEW_CARD" : "PREVIOUS_CARD",
              })
            }
          >
            Thẻ trước
          </button>
        )}
        <button
          type="button"
          className="flashcard-study-button"
          disabled={!state.answerVisible}
          onClick={() =>
            dispatch(
              isReviewing
                ? { type: "NEXT_REVIEW_CARD", reviewCount: cards.length }
                : { type: "NEXT_CARD", totalCards: cards.length },
            )
          }
        >
          {isLastCard
            ? isReviewing
              ? "Hoàn thành ôn tập"
              : "Hoàn thành học"
            : "Thẻ tiếp theo"}
        </button>
      </nav>
      {isReviewing && (
        <button
          type="button"
          className="flashcard-study-summary-link"
          onClick={() => dispatch({ type: "RETURN_TO_SUMMARY" })}
        >
          Quay lại tổng kết
        </button>
      )}
    </section>
  );
}

export { FlashcardStudyView };
export default FlashcardStudyView;
