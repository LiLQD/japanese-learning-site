export type FlashcardDeckListItem = {
  id: number;
  name: string;
  description: string | null;
  visibility: "PERSONAL" | "SHARED";
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardDeckListResponse = {
  decks: FlashcardDeckListItem[];
};
