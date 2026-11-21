import type { FlashcardItem } from "@app/shared";

export type FlashcardReviewStatus = "REMEMBERED" | "NEEDS_REVIEW";
export type FlashcardReviewStatuses = Record<number, FlashcardReviewStatus>;

export type FlashcardReviewSummary = {
  total: number;
  remembered: number;
  needsReview: number;
  unanswered: number;
};

export type FlashcardStudyPhase =
  | "STUDYING"
  | "SUMMARY"
  | "REVIEWING"
  | "REVIEW_COMPLETE";

export type FlashcardStudyState = {
  phase: FlashcardStudyPhase;
  currentIndex: number;
  answerVisible: boolean;
  reviewStatuses: FlashcardReviewStatuses;
};

export type FlashcardStudyAction =
  | { type: "SHOW_ANSWER" }
  | { type: "HIDE_ANSWER" }
  | { type: "RATE_CARD"; cardId: number; status: FlashcardReviewStatus }
  | { type: "NEXT_CARD"; totalCards: number }
  | { type: "PREVIOUS_CARD" }
  | { type: "START_REVIEW"; reviewCount: number }
  | { type: "NEXT_REVIEW_CARD"; reviewCount: number }
  | { type: "PREVIOUS_REVIEW_CARD" }
  | { type: "RETURN_TO_SUMMARY" }
  | { type: "RESET_SESSION" };

export const initialFlashcardStudyState: FlashcardStudyState = {
  phase: "STUDYING",
  currentIndex: 0,
  answerVisible: false,
  reviewStatuses: {},
};

export function setFlashcardReviewStatus(
  statuses: FlashcardReviewStatuses,
  cardId: number,
  status: FlashcardReviewStatus,
): FlashcardReviewStatuses {
  return { ...statuses, [cardId]: status };
}

export function getFlashcardsToReview(
  cards: FlashcardItem[],
  statuses: FlashcardReviewStatuses,
): FlashcardItem[] {
  return cards.filter((card) => statuses[card.id] === "NEEDS_REVIEW");
}

export function getFlashcardReviewSummary(
  cards: FlashcardItem[],
  statuses: FlashcardReviewStatuses,
): FlashcardReviewSummary {
  const remembered = cards.filter(
    (card) => statuses[card.id] === "REMEMBERED",
  ).length;
  const needsReview = cards.filter(
    (card) => statuses[card.id] === "NEEDS_REVIEW",
  ).length;

  return {
    total: cards.length,
    remembered,
    needsReview,
    unanswered: cards.length - remembered - needsReview,
  };
}

export function confirmFlashcardSessionExit(
  confirmExit: (message: string) => boolean,
  onExit: () => void,
): boolean {
  if (
    !confirmExit(
      "Bạn có chắc muốn thoát phiên học? Tiến độ phiên này sẽ bị xóa.",
    )
  ) {
    return false;
  }
  onExit();
  return true;
}

export function confirmFlashcardNavigation(
  destination: string,
  currentPath: string,
  hasActiveSession: boolean,
  confirmExit: (message: string) => boolean,
  navigate: (destination: string) => void,
): boolean {
  if (!hasActiveSession || destination === currentPath) return false;
  return confirmFlashcardSessionExit(confirmExit, () => navigate(destination));
}

export function flashcardStudyReducer(
  state: FlashcardStudyState,
  action: FlashcardStudyAction,
): FlashcardStudyState {
  switch (action.type) {
    case "RESET_SESSION":
      return initialFlashcardStudyState;
    case "SHOW_ANSWER":
      return { ...state, answerVisible: true };
    case "HIDE_ANSWER":
      return { ...state, answerVisible: false };
    case "RATE_CARD":
      if (state.phase !== "STUDYING" || !state.answerVisible) return state;
      return {
        ...state,
        reviewStatuses: setFlashcardReviewStatus(
          state.reviewStatuses,
          action.cardId,
          action.status,
        ),
      };
    case "NEXT_CARD":
      if (state.phase !== "STUDYING" || !state.answerVisible) return state;
      if (state.currentIndex + 1 >= action.totalCards) {
        return { ...state, phase: "SUMMARY", answerVisible: false };
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        answerVisible: false,
      };
    case "PREVIOUS_CARD":
      if (state.phase !== "STUDYING" || state.currentIndex === 0) return state;
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        answerVisible: false,
      };
    case "START_REVIEW":
      if (state.phase !== "SUMMARY" || action.reviewCount === 0) return state;
      return {
        ...state,
        phase: "REVIEWING",
        currentIndex: 0,
        answerVisible: false,
      };
    case "NEXT_REVIEW_CARD":
      if (state.phase !== "REVIEWING") return state;
      if (state.currentIndex + 1 >= action.reviewCount) {
        return { ...state, phase: "REVIEW_COMPLETE", answerVisible: false };
      }
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        answerVisible: false,
      };
    case "PREVIOUS_REVIEW_CARD":
      if (state.phase !== "REVIEWING" || state.currentIndex === 0) return state;
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        answerVisible: false,
      };
    case "RETURN_TO_SUMMARY":
      if (state.phase !== "REVIEWING") return state;
      return {
        ...state,
        phase: "SUMMARY",
        currentIndex: 0,
        answerVisible: false,
      };
  }
}
