import type { ErrorResponse, FlashcardDeckListResponse } from "@app/shared";

export const CONNECTION_ERROR = "Lỗi kết nối!";

export async function fetchFlashcardDecks(): Promise<FlashcardDeckListResponse> {
  let response: Response;

  try {
    response = await fetch("/api/flashcards/decks", {
      credentials: "include",
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status >= 500) {
    throw new Error(CONNECTION_ERROR);
  }

  if (response.status === 401) {
    throw new Error("Vui lòng đăng nhập để xem bộ flashcard.");
  }

  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => null)) as ErrorResponse | null;
    throw new Error(
      data?.error?.message ?? "Không thể tải danh sách bộ flashcard.",
    );
  }

  return (await response.json()) as FlashcardDeckListResponse;
}
