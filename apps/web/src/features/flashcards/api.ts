import type {
  ErrorResponse,
  FlashcardCardCreateInput,
  FlashcardCardUpdateInput,
  FlashcardDeckCreateInput,
  FlashcardDeckDetailResponse,
  FlashcardDeckListResponse,
  FlashcardItem,
} from "@app/shared";

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

async function flashcardRequest<T>(
  url: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  let response: Response;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(CONNECTION_ERROR);
  }

  const data = (await response.json().catch(() => null)) as
    | T
    | ErrorResponse
    | null;
  if (!response.ok) {
    const error =
      data !== null && typeof data === "object" && "error" in data
        ? data.error
        : null;
    if (response.status >= 500 || error?.code === "DATABASE_UNAVAILABLE") {
      throw new Error(CONNECTION_ERROR);
    }
    if (error?.code === "UNAUTHORIZED") {
      throw new Error("Vui lòng đăng nhập để tiếp tục.");
    }
    if (error?.code === "FORBIDDEN") {
      throw new Error("Bạn không có quyền thực hiện thao tác này.");
    }
    throw new Error(error?.message ?? fallbackMessage);
  }

  return data as T;
}

export function fetchFlashcardDeck(
  deckId: number,
): Promise<FlashcardDeckDetailResponse> {
  return flashcardRequest(
    `/api/flashcards/decks/${deckId}`,
    { method: "GET" },
    "Không thể tải bộ flashcard.",
  );
}

export function fetchFlashcardDeckForLearning(
  deckId: number,
): Promise<FlashcardDeckDetailResponse> {
  return flashcardRequest(
    `/api/flashcards/decks/${deckId}/learning`,
    { method: "GET" },
    "KhÃ´ng thá»ƒ táº£i bá»™ flashcard.",
  );
}

export function createFlashcardDeck(
  input: FlashcardDeckCreateInput,
): Promise<{ deck: FlashcardDeckListResponse["decks"][number] }> {
  return flashcardRequest(
    "/api/flashcards/decks",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Không thể tạo bộ flashcard.",
  );
}

export function createFlashcard(
  deckId: number,
  input: FlashcardCardCreateInput,
): Promise<{ card: FlashcardItem }> {
  return flashcardRequest(
    `/api/flashcards/decks/${deckId}/cards`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "Không thể thêm flashcard.",
  );
}

export function updateFlashcard(
  deckId: number,
  cardId: number,
  input: FlashcardCardUpdateInput,
): Promise<{ card: FlashcardItem }> {
  return flashcardRequest(
    `/api/flashcards/decks/${deckId}/cards/${cardId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    "Không thể cập nhật flashcard.",
  );
}

export async function deleteFlashcard(
  deckId: number,
  cardId: number,
): Promise<void> {
  await flashcardRequest<null>(
    `/api/flashcards/decks/${deckId}/cards/${cardId}`,
    { method: "DELETE" },
    "Không thể xóa flashcard.",
  );
}
