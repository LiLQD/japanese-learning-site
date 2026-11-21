import { describe, expect, it, vi } from "vitest";
import type { FlashcardItem } from "@app/shared";
import {
  confirmFlashcardSessionExit,
  confirmFlashcardNavigation,
  getFlashcardsToReview,
  getFlashcardReviewSummary,
  flashcardStudyReducer,
  initialFlashcardStudyState,
  setFlashcardReviewStatus,
} from "../../web/src/features/flashcards/learning-session.js";

const cards: FlashcardItem[] = [
  {
    id: 1,
    front: "猫",
    back: "Mèo",
    position: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: 2,
    front: "犬",
    back: "Chó",
    position: 2,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: 3,
    front: "鳥",
    back: "Chim",
    position: 3,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
];

describe("flashcard learning session review state", () => {
  it("records and allows changing a card's review status", () => {
    const remembered = setFlashcardReviewStatus({}, 1, "REMEMBERED");
    const needsReview = setFlashcardReviewStatus(remembered, 1, "NEEDS_REVIEW");

    expect(remembered[1]).toBe("REMEMBERED");
    expect(needsReview[1]).toBe("NEEDS_REVIEW");
    expect(remembered).not.toBe(needsReview);
  });

  it("includes only explicitly marked needs-review cards, in deck order", () => {
    const statuses = setFlashcardReviewStatus(
      setFlashcardReviewStatus({}, 3, "NEEDS_REVIEW"),
      2,
      "REMEMBERED",
    );

    expect(
      getFlashcardsToReview(cards, statuses).map((card) => card.id),
    ).toEqual([3]);
  });

  it("keeps unanswered cards separate from remembered and needs-review", () => {
    const statuses = setFlashcardReviewStatus(
      setFlashcardReviewStatus({}, 1, "REMEMBERED"),
      2,
      "NEEDS_REVIEW",
    );

    expect(getFlashcardReviewSummary(cards, statuses)).toEqual({
      total: 3,
      remembered: 1,
      needsReview: 1,
      unanswered: 1,
    });
    expect(
      getFlashcardsToReview(cards, statuses).map((card) => card.id),
    ).toEqual([2]);
  });

  it("does not classify an unrated card as needing review", () => {
    expect(getFlashcardsToReview(cards, {}).map((card) => card.id)).toEqual([]);
    expect(getFlashcardReviewSummary(cards, {})).toEqual({
      total: 3,
      remembered: 0,
      needsReview: 0,
      unanswered: 3,
    });
  });

  it("requires viewing the answer before rating or advancing", () => {
    const initial = initialFlashcardStudyState;
    const rated = flashcardStudyReducer(initial, {
      type: "RATE_CARD",
      cardId: 1,
      status: "NEEDS_REVIEW",
    });
    const advanced = flashcardStudyReducer(initial, {
      type: "NEXT_CARD",
      totalCards: 3,
    });

    expect(rated).toBe(initial);
    expect(advanced).toBe(initial);
  });

  it("resets the answer when navigating and keeps each card's rating", () => {
    let state = flashcardStudyReducer(initialFlashcardStudyState, {
      type: "SHOW_ANSWER",
    });
    state = flashcardStudyReducer(state, {
      type: "RATE_CARD",
      cardId: 1,
      status: "NEEDS_REVIEW",
    });
    state = flashcardStudyReducer(state, {
      type: "NEXT_CARD",
      totalCards: 3,
    });
    state = flashcardStudyReducer(state, { type: "SHOW_ANSWER" });
    state = flashcardStudyReducer(state, {
      type: "RATE_CARD",
      cardId: 2,
      status: "REMEMBERED",
    });
    state = flashcardStudyReducer(state, { type: "PREVIOUS_CARD" });

    expect(state.currentIndex).toBe(0);
    expect(state.answerVisible).toBe(false);
    expect(state.reviewStatuses).toEqual({
      1: "NEEDS_REVIEW",
      2: "REMEMBERED",
    });
  });

  it("moves from the last card to summary and starts review only with missed cards", () => {
    let state = initialFlashcardStudyState;
    state = flashcardStudyReducer(state, { type: "SHOW_ANSWER" });
    state = flashcardStudyReducer(state, {
      type: "NEXT_CARD",
      totalCards: 1,
    });
    expect(state.phase).toBe("SUMMARY");

    const noReview = flashcardStudyReducer(state, {
      type: "START_REVIEW",
      reviewCount: 0,
    });
    expect(noReview).toBe(state);

    state = {
      ...state,
      reviewStatuses: setFlashcardReviewStatus({}, 1, "NEEDS_REVIEW"),
    };
    state = flashcardStudyReducer(state, {
      type: "START_REVIEW",
      reviewCount: 1,
    });
    expect(state.phase).toBe("REVIEWING");
    state = flashcardStudyReducer(state, {
      type: "NEXT_REVIEW_CARD",
      reviewCount: 1,
    });
    expect(state.phase).toBe("REVIEW_COMPLETE");
  });

  it("keeps the session when exit is cancelled and exits only after confirmation", () => {
    const onExit = vi.fn();
    const cancel = confirmFlashcardSessionExit(() => false, onExit);
    const confirm = confirmFlashcardSessionExit(() => true, onExit);

    expect(cancel).toBe(false);
    expect(confirm).toBe(true);
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("blocks in-app navigation on cancel and navigates after confirmation", () => {
    const navigate = vi.fn();
    const destination = "/flashcards";
    const currentPath = "/flashcards/12/learn";
    const cancelled = confirmFlashcardNavigation(
      destination,
      currentPath,
      true,
      () => false,
      navigate,
    );
    const confirmed = confirmFlashcardNavigation(
      destination,
      currentPath,
      true,
      () => true,
      navigate,
    );

    expect(cancelled).toBe(false);
    expect(confirmed).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(destination);
  });

  it("resets all in-memory progress when a new session starts", () => {
    const state = flashcardStudyReducer(
      {
        ...initialFlashcardStudyState,
        currentIndex: 2,
        answerVisible: true,
        reviewStatuses: { 1: "NEEDS_REVIEW" },
      },
      { type: "RESET_SESSION" },
    );

    expect(state).toEqual(initialFlashcardStudyState);
  });
});
