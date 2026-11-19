import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../contexts/auth-context";
import {
  createFlashcard,
  deleteFlashcard,
  fetchFlashcardDeck,
  updateFlashcard,
} from "../api";
import "./FlashcardDeckListPage.css";

function FlashcardDeckPage() {
  const { user } = useAuth();
  const { deckId: deckIdParam } = useParams();
  const deckId = Number(deckIdParam);
  const isValidDeckId = Number.isInteger(deckId) && deckId > 0;
  const queryClient = useQueryClient();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingFront, setEditingFront] = useState("");
  const [editingBack, setEditingBack] = useState("");
  const [formError, setFormError] = useState("");

  const query = useQuery({
    queryKey: ["flashcardDeck", user?.id, deckId],
    queryFn: () => fetchFlashcardDeck(deckId),
    enabled: user !== null && isValidDeckId,
    retry: false,
  });

  const refreshDeck = () => {
    void queryClient.invalidateQueries({
      queryKey: ["flashcardDeck", user?.id, deckId],
    });
    void queryClient.invalidateQueries({ queryKey: ["flashcardDecks"] });
  };

  const addMutation = useMutation({
    mutationFn: () => createFlashcard(deckId, { front, back }),
    onSuccess: () => {
      setFront("");
      setBack("");
      setFormError("");
      refreshDeck();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateFlashcard(deckId, editingCardId!, {
        front: editingFront,
        back: editingBack,
      }),
    onSuccess: () => {
      setEditingCardId(null);
      setFormError("");
      refreshDeck();
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (cardId: number) => deleteFlashcard(deckId, cardId),
    onSuccess: refreshDeck,
    onError: (error: Error) => setFormError(error.message),
  });

  const deck = query.data?.deck;
  const canEdit = deck?.visibility === "PERSONAL";

  return (
    <div className="flashcard-layout">
      <Navbar />
      <main className="flashcard-main">
        <Link to="/flashcards" className="flashcard-back-link">
          ← Danh sách bộ flashcard
        </Link>
        {!isValidDeckId && (
          <div className="flashcard-error" role="alert">
            Không tìm thấy bộ flashcard.
          </div>
        )}
        {query.isPending && (
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
          <>
            <header className="flashcard-page-header">
              <p className="flashcard-eyebrow">
                {deck.visibility === "SHARED" ? "BỘ THẺ MẪU" : "BỘ THẺ CỦA TÔI"}
              </p>
              <h1>{deck.name}</h1>
              {deck.description && (
                <p className="flashcard-description">{deck.description}</p>
              )}
            </header>
            {!canEdit && (
              <p className="flashcard-note">
                Đây là bộ flashcard dùng chung và chỉ có thể xem.
              </p>
            )}
            {canEdit && (
              <form
                className="flashcard-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  addMutation.mutate();
                }}
              >
                <h2>Thêm flashcard</h2>
                <label>
                  Mặt trước
                  <textarea
                    value={front}
                    onChange={(event) => setFront(event.target.value)}
                    required
                    rows={2}
                  />
                </label>
                <label>
                  Mặt sau
                  <textarea
                    value={back}
                    onChange={(event) => setBack(event.target.value)}
                    required
                    rows={3}
                  />
                </label>
                <button
                  type="submit"
                  className="flashcard-create-button"
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? "Đang thêm..." : "Thêm flashcard"}
                </button>
              </form>
            )}
            {formError && (
              <p className="flashcard-form-error" role="alert">
                {formError}
              </p>
            )}
            <section className="flashcard-cards-section">
              <h2>Flashcard ({deck.cards.length})</h2>
              {deck.cards.length === 0 ? (
                <p className="flashcard-note">Chưa có flashcard nào.</p>
              ) : (
                <ol className="flashcard-card-list">
                  {deck.cards.map((card) => (
                    <li key={card.id} className="flashcard-card-item">
                      {editingCardId === card.id ? (
                        <form
                          className="flashcard-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            updateMutation.mutate();
                          }}
                        >
                          <label>
                            Mặt trước
                            <textarea
                              value={editingFront}
                              onChange={(event) =>
                                setEditingFront(event.target.value)
                              }
                              required
                              rows={2}
                            />
                          </label>
                          <label>
                            Mặt sau
                            <textarea
                              value={editingBack}
                              onChange={(event) =>
                                setEditingBack(event.target.value)
                              }
                              required
                              rows={3}
                            />
                          </label>
                          <div className="flashcard-card-actions">
                            <button
                              type="submit"
                              className="flashcard-create-button"
                              disabled={updateMutation.isPending}
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              className="flashcard-secondary-button"
                              onClick={() => setEditingCardId(null)}
                            >
                              Hủy
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <span className="flashcard-card-position">
                            {card.position}
                          </span>
                          <div>
                            <h3>{card.front}</h3>
                            <p>{card.back}</p>
                          </div>
                          {canEdit && (
                            <div className="flashcard-card-actions">
                              <button
                                type="button"
                                className="flashcard-secondary-button"
                                onClick={() => {
                                  setEditingCardId(card.id);
                                  setEditingFront(card.front);
                                  setEditingBack(card.back);
                                  setFormError("");
                                }}
                              >
                                Chỉnh sửa
                              </button>
                              <button
                                type="button"
                                className="flashcard-danger-button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Bạn có chắc muốn xóa flashcard này?",
                                    )
                                  ) {
                                    deleteMutation.mutate(card.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default FlashcardDeckPage;
