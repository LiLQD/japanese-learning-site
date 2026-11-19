// @ts-expect-error React is resolved from the web workspace for this SSR test.
import { createElement } from "../../web/node_modules/react/index.js";
// @ts-expect-error React DOM is resolved from the web workspace for this SSR test.
import { renderToStaticMarkup } from "../../web/node_modules/react-dom/server.js";
import { MemoryRouter } from "../../web/node_modules/react-router/dist/development/index.js";
import { describe, expect, it } from "vitest";
import type { FlashcardDeckListItem } from "@app/shared";
import FlashcardDeckListView from "../../web/src/features/flashcards/components/FlashcardDeckListView.js";

const decks: FlashcardDeckListItem[] = [
  {
    id: 8,
    name: "Từ vựng N5",
    description: "Các từ vựng cơ bản.",
    visibility: "SHARED",
    cardCount: 12,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
  {
    id: 9,
    name: "Deck cá nhân",
    description: null,
    visibility: "PERSONAL",
    cardCount: 2,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
  },
];

function renderView({
  items = null,
  isLoading = false,
  errorMessage = "",
}: {
  items?: FlashcardDeckListItem[] | null;
  isLoading?: boolean;
  errorMessage?: string;
} = {}) {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ["/flashcards"] },
      createElement(FlashcardDeckListView, {
        decks: items,
        isLoading,
        errorMessage,
        onRetry: () => {},
      }),
    ),
  );
}

describe("Flashcard deck list frontend", () => {
  it("shows a loading state while the list is being fetched", () => {
    expect(renderView({ isLoading: true })).toContain(
      "Đang tải danh sách bộ flashcard...",
    );
  });

  it("shows the requested empty state", () => {
    const markup = renderView({ items: [] });

    expect(markup).toContain("Bạn chưa có bộ flashcard nào");
  });

  it("shows a friendly error and a retry action", () => {
    const markup = renderView({
      errorMessage: "Không thể tải danh sách bộ flashcard. Vui lòng thử lại.",
    });

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Không thể tải danh sách bộ flashcard.");
    expect(markup).toContain("Thử tải lại");
  });

  it("shows deck metadata and links each deck to its detail page", () => {
    const markup = renderView({ items: decks });

    expect(markup).toContain("Bộ flashcard mẫu");
    expect(markup).toContain("Bộ flashcard của tôi");
    expect(markup).toContain("Dùng chung");
    expect(markup).toContain("Từ vựng N5");
    expect(markup).toContain("Các từ vựng cơ bản.");
    expect(markup).toContain("Deck cá nhân");
    expect(markup).toContain("12 thẻ");
    expect(markup).toContain('href="/flashcards/8"');
    expect(markup).toContain('href="/flashcards/9"');
    expect(markup).not.toContain("flashcard answer");
  });

  it("keeps the shared group visible when the user has no personal decks", () => {
    const markup = renderView({ items: [decks[0]] });

    expect(markup).toContain("Từ vựng N5");
    expect(markup).toContain("Bộ flashcard của tôi");
    expect(markup).toContain("Bạn chưa có bộ flashcard cá nhân nào");
  });
});
