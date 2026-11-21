import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFlashcardDeckForLearning } from "../../web/src/features/flashcards/api.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchFlashcardDeckForLearning", () => {
  it("calls the personal learning endpoint with cookie credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ deck: { id: 7, cards: [] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchFlashcardDeckForLearning(7)).resolves.toEqual({
      deck: { id: 7, cards: [] },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/flashcards/decks/7/learning",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("shows the specified connection error when the request cannot connect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchFlashcardDeckForLearning(7)).rejects.toThrow(
      "Lỗi kết nối!",
    );
  });

  it("uses the localized fallback when the learning endpoint returns no message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }),
    );

    await expect(fetchFlashcardDeckForLearning(7)).rejects.toThrow(
      "Không thể tải bộ flashcard.",
    );
  });
});
