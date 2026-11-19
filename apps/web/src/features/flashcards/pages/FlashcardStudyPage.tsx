import { useEffect, useReducer, useRef, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import { fetchFlashcardDeckForLearning } from "../api";
import { FlashcardStudyView } from "../components/FlashcardStudyView";
import {
  confirmFlashcardNavigation,
  confirmFlashcardSessionExit,
  flashcardStudyReducer,
  initialFlashcardStudyState,
} from "../learning-session";
import "./FlashcardDeckListPage.css";

function FlashcardStudyPage() {
  const { user } = useAuth();
  const { deckId: deckIdParam } = useParams();
  const deckId = Number(deckIdParam);
  const isValidDeckId = Number.isInteger(deckId) && deckId > 0;
  const navigate = useNavigate();
  const sessionDeckId = useRef(deckId);
  const [state, dispatch] = useReducer(
    flashcardStudyReducer,
    initialFlashcardStudyState,
  );
  useEffect(() => {
    if (sessionDeckId.current !== deckId) {
      sessionDeckId.current = deckId;
      dispatch({ type: "RESET_SESSION" });
    }
  }, [deckId]);
  const query = useQuery({
    queryKey: ["flashcardLearningDeck", user?.id, deckId],
    queryFn: () => fetchFlashcardDeckForLearning(deckId),
    enabled: user !== null && user.role === "USER" && isValidDeckId,
    retry: false,
  });
  const deck = query.data?.deck;

  const exitSession = () => {
    confirmFlashcardSessionExit(
      (message) => window.confirm(message),
      () => void navigate("/flashcards"),
    );
  };

  const confirmNavigation = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link || link.target || link.hasAttribute("download")) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (destination.pathname === window.location.pathname) return;

    const hasActiveSession = Boolean(deck?.cards.length);
    if (
      !hasActiveSession ||
      destination.pathname === window.location.pathname
    ) {
      return;
    }

    event.preventDefault();
    confirmFlashcardNavigation(
      `${destination.pathname}${destination.search}${destination.hash}`,
      window.location.pathname,
      hasActiveSession,
      (message) => window.confirm(message),
      (path) => void navigate(path),
    );
  };

  return (
    <div className="flashcard-layout" onClickCapture={confirmNavigation}>
      <Navbar />
      <main className="flashcard-main flashcard-study-main">
        <button
          type="button"
          className="flashcard-back-link flashcard-study-back-button"
          onClick={exitSession}
        >
          ← Danh sách bộ flashcard
        </button>
        {!isValidDeckId && (
          <div className="flashcard-error" role="alert">
            Không tìm thấy bộ flashcard.
          </div>
        )}
        {user?.role === "ADMIN" && (
          <div className="flashcard-error" role="alert">
            Chỉ học viên mới có thể bắt đầu phiên học.
          </div>
        )}
        {query.isPending && isValidDeckId && user?.role === "USER" && (
          <p className="flashcard-note" role="status">
            Đang tải bộ flashcard...
          </p>
        )}
        {query.isError && (
          <div className="flashcard-error" role="alert">
            {query.error instanceof Error
              ? query.error.message
              : "Không thể tải bộ flashcard."}
          </div>
        )}
        {deck && (
          <FlashcardStudyView
            deck={deck}
            state={state}
            dispatch={dispatch}
            onExit={exitSession}
          />
        )}
      </main>
    </div>
  );
}

export default FlashcardStudyPage;
