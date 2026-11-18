BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "flashcards"
        GROUP BY "deckId", "position"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add unique flashcards(deckId, position): duplicate positions exist. Resolve them explicitly before retrying this migration.';
    END IF;
END $$;

CREATE TYPE "FlashcardDeckVisibility" AS ENUM ('PERSONAL', 'SHARED');

ALTER TABLE "flashcard_decks"
    ALTER COLUMN "userId" DROP NOT NULL,
    ADD COLUMN "visibility" "FlashcardDeckVisibility" NOT NULL DEFAULT 'PERSONAL',
    ADD COLUMN "seedKey" TEXT;

ALTER TABLE "flashcards"
    ADD COLUMN "seedKey" TEXT;

ALTER TABLE "flashcard_decks"
    ADD CONSTRAINT "flashcard_decks_visibility_owner_check"
    CHECK (
        ("visibility" = 'PERSONAL' AND "userId" IS NOT NULL)
        OR ("visibility" = 'SHARED' AND "userId" IS NULL)
    );

CREATE UNIQUE INDEX "flashcard_decks_seedKey_key"
    ON "flashcard_decks"("seedKey");

CREATE UNIQUE INDEX "flashcards_seedKey_key"
    ON "flashcards"("seedKey");

CREATE UNIQUE INDEX "flashcards_deckId_position_key"
    ON "flashcards"("deckId", "position");

COMMIT;
