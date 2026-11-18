import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/auth-context";
import Navbar from "../../../components/Navbar";
import { fetchFlashcardDecks } from "../api";
import FlashcardDeckListView from "../components/FlashcardDeckListView";
import "./FlashcardDeckListPage.css";

function FlashcardDeckListPage() {
  const { user } = useAuth();
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["flashcardDecks", user?.id],
    queryFn: fetchFlashcardDecks,
    enabled: user !== null,
    retry: false,
  });

  const errorMessage = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : "Không thể tải danh sách bộ flashcard."
    : "";

  return (
    <div className="flashcard-layout">
      <Navbar />
      <main className="flashcard-main">
        <header className="flashcard-page-header">
          <p className="flashcard-eyebrow">YUME · HỌC TẬP</p>
          <h1>Bộ flashcard</h1>
          <p className="flashcard-description">
            Khám phá bộ flashcard mẫu và các bộ thuộc tài khoản của bạn.
          </p>
        </header>
        <FlashcardDeckListView
          decks={query.data?.decks ?? null}
          isLoading={query.isPending}
          errorMessage={errorMessage}
          selectedDeckId={selectedDeckId}
          onRetry={() => void query.refetch()}
          onSelectDeck={setSelectedDeckId}
        />
      </main>
    </div>
  );
}

export default FlashcardDeckListPage;
