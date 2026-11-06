import { z } from "zod";

export const wordListQuerySchema = z.object({
  q: z.string().trim().default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const wordIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type WordListQuery = z.infer<typeof wordListQuerySchema>;
export type WordIdParams = z.infer<typeof wordIdSchema>;

export type WordLookup = {
  id: number;
  text: string;
  jlpt: number | null;
  kana: string | null;
  romaji: string | null;
  senses: {
    position: number;
    partOfSpeech: string[];
    meanings: string[];
  }[];
};

export type WordListResponse = {
  words: WordLookup[];
  total: number;
  page: number;
  pageSize: number;
};

export type WordDetailResponse = {
  word: WordLookup;
};
