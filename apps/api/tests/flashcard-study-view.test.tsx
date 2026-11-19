// @ts-expect-error React is resolved from the web workspace for this SSR test.
import { createElement } from "../../web/node_modules/react/index.js";
// @ts-expect-error React DOM is resolved from the web workspace for this SSR test.
import { renderToStaticMarkup } from "../../web/node_modules/react-dom/server.js";
import { MemoryRouter } from "../../web/node_modules/react-router/dist/development/index.js";
import { describe, expect, it } from "vitest";
import type { FlashcardDeckDetail } from "@app/shared";
import { FlashcardStudyView } from "../../web/src/features/flashcards/components/FlashcardStudyView.js";
import {
  initialFlashcardStudyState,
  setFlashcardReviewStatus,
} from "../../web/src/features/flashcards/learning-session.js";

const deck: FlashcardDeckDetail = {
  id: 12,
  name: "Từ vựng N5",
  description: null,
  visibility: "PERSONAL",
  cardCount: 2,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  cards: [
    {
      id: 4,
      front: "猫",
      back: "Mèo bí mật",
      position: 1,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
    {
      id: 5,
      front: "犬",
      back: "Chó",
      position: 2,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  ],
};

function renderView(
  state = initialFlashcardStudyState,
  value: FlashcardDeckDetail | null = deck,
) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ["/flashcards/12/learn"] },
      createElement(FlashcardStudyView, {
        deck: value,
        state,
        dispatch: () => {},
        onExit: () => {},
      }),
    ),
  );
}

describe("FlashcardStudyView", () => {
  it("shows only the front of the first card and exposes an answer button", () => {
    const markup = renderView();

    expect(markup).toContain("Từ vựng N5");
    expect(markup).toContain("猫");
    expect(markup).toContain("1 / 2");
    expect(markup).toContain('aria-label="Xem đáp án"');
    expect(markup).not.toContain("Mèo bí mật");
    expect(markup).toContain('role="progressbar"');
  });

  it("shows the answer and review choices only after the card is flipped", () => {
    const markup = renderView({
      ...initialFlashcardStudyState,
      answerVisible: true,
    });

    expect(markup).toContain("Mèo bí mật");
    expect(markup).toContain("Nhớ");
    expect(markup).toContain("Chưa nhớ");
    expect(markup).toContain('aria-label="Ẩn đáp án"');
  });

  it("supports front, answer and review controls for a shared deck", () => {
    const sharedDeck = { ...deck, visibility: "SHARED" as const };
    const frontMarkup = renderView(initialFlashcardStudyState, sharedDeck);
    const answerMarkup = renderView(
      { ...initialFlashcardStudyState, answerVisible: true },
      sharedDeck,
    );
    const reviewSummary = renderView(
      {
        ...initialFlashcardStudyState,
        phase: "SUMMARY",
        reviewStatuses: setFlashcardReviewStatus({}, 4, "NEEDS_REVIEW"),
      },
      sharedDeck,
    );

    expect(frontMarkup).toContain("猫");
    expect(frontMarkup).not.toContain("Mèo bí mật");
    expect(answerMarkup).toContain("Mèo bí mật");
    expect(answerMarkup).toContain("Nhớ");
    expect(answerMarkup).toContain("Chưa nhớ");
    expect(reviewSummary).toContain("<dt>Chưa nhớ</dt><dd>1</dd>");
    expect(reviewSummary).toContain("Ôn tập flashcard (1)");
  });

  it("marks long answer text for a smaller contained text style", () => {
    const longAnswerDeck = {
      ...deck,
      cards: [
        {
          ...deck.cards[0],
          back: "日本語の長い答えです。".repeat(12),
        },
      ],
      cardCount: 1,
    };
    const markup = renderView(
      { ...initialFlashcardStudyState, answerVisible: true },
      longAnswerDeck,
    );

    expect(markup).toContain("flashcard-study-back-face is-long");
  });

  it("reports remembered, needs-review and unanswered cards in the summary", () => {
    const state = {
      ...initialFlashcardStudyState,
      phase: "SUMMARY" as const,
      reviewStatuses: setFlashcardReviewStatus(
        setFlashcardReviewStatus({}, 4, "REMEMBERED"),
        5,
        "NEEDS_REVIEW",
      ),
    };
    const markup = renderView(state);

    expect(markup).toContain("<dt>Đã học</dt><dd>2</dd>");
    expect(markup).toContain("<dt>Nhớ</dt><dd>1</dd>");
    expect(markup).toContain("<dt>Chưa nhớ</dt><dd>1</dd>");
    expect(markup).toContain("<dt>Chưa đánh giá</dt><dd>0</dd>");
    expect(markup).toContain("Ôn tập flashcard");
  });

  it("offers a finish action when there are no cards to review", () => {
    const markup = renderView({
      ...initialFlashcardStudyState,
      phase: "SUMMARY",
      reviewStatuses: setFlashcardReviewStatus(
        setFlashcardReviewStatus({}, 4, "REMEMBERED"),
        5,
        "REMEMBERED",
      ),
    });

    expect(markup).toContain("Không có thẻ nào cần ôn tập.");
    expect(markup).toContain("Kết thúc phiên học");
    expect(markup).not.toContain("Ôn tập flashcard");
  });

  it("reports completed review instead of claiming there were no missed cards", () => {
    const markup = renderView({
      ...initialFlashcardStudyState,
      phase: "REVIEW_COMPLETE",
      reviewStatuses: setFlashcardReviewStatus({}, 5, "NEEDS_REVIEW"),
    });

    expect(markup).toContain("Đã hoàn thành ôn tập 1 thẻ.");
    expect(markup).not.toContain("Không có thẻ nào cần ôn tập.");
  });

  it("shows only missed cards in the review queue", () => {
    const sharedDeck = { ...deck, visibility: "SHARED" as const };
    const markup = renderView(
      {
        ...initialFlashcardStudyState,
        phase: "REVIEWING",
        currentIndex: 0,
        reviewStatuses: setFlashcardReviewStatus(
          setFlashcardReviewStatus({}, 4, "REMEMBERED"),
          5,
          "NEEDS_REVIEW",
        ),
      },
      sharedDeck,
    );

    expect(markup).toContain("犬");
    expect(markup).not.toContain("猫");
    expect(markup).not.toContain("Chó bí mật");
  });

  it("shows the required empty-deck message and a way back to deck selection", () => {
    const markup = renderView(initialFlashcardStudyState, {
      ...deck,
      visibility: "SHARED",
      cards: [],
      cardCount: 0,
    });

    expect(markup).toContain("Bộ flashcard này chưa có thẻ từ vựng nào");
    expect(markup).toContain('href="/flashcards"');
  });
});
