import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/auth-context";
import Navbar from "../../../components/Navbar";
import { createFlashcardDeck, fetchFlashcardDecks } from "../api";
import FlashcardDeckListView from "../components/FlashcardDeckListView";
import "./FlashcardDeckListPage.css";
import { useState } from "react";

function FlashcardDeckListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const query = useQuery({
    queryKey: ["flashcardDecks", user?.id],
    queryFn: fetchFlashcardDecks,
    enabled: user !== null,
    retry: false,
  });
  const createMutation = useMutation({
    mutationFn: createFlashcardDeck,
    onSuccess: ({ deck }) => {
      setName("");
      setDescription("");
      setFormError("");
      void queryClient.invalidateQueries({ queryKey: ["flashcardDecks"] });
      void navigate(`/flashcards/${deck.id}`);
    },
    onError: (error: Error) => setFormError(error.message),
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
        <form
          className="flashcard-form flashcard-deck-form"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate({ name, description });
          }}
        >
          <h2>Tạo bộ flashcard</h2>
          <label>
            Tên bộ thẻ
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <label>
            Mô tả
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
            />
          </label>
          {formError && <p className="flashcard-form-error">{formError}</p>}
          <button
            type="submit"
            className="flashcard-create-button"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Đang tạo..." : "Tạo bộ flashcard"}
          </button>
        </form>
        <FlashcardDeckListView
          decks={query.data?.decks ?? null}
          isLoading={query.isPending}
          errorMessage={errorMessage}
          onRetry={() => void query.refetch()}
        />
      </main>
    </div>
  );
}

export default FlashcardDeckListPage;
