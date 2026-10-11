-- CreateTable
CREATE TABLE "words" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "jlpt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" SERIAL NOT NULL,
    "wordId" INTEGER NOT NULL,
    "kana" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "senses" (
    "id" SERIAL NOT NULL,
    "wordId" INTEGER NOT NULL,
    "partOfSpeech" TEXT[],
    "position" INTEGER NOT NULL,

    CONSTRAINT "senses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glosses" (
    "id" SERIAL NOT NULL,
    "senseId" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "glosses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanji" (
    "id" SERIAL NOT NULL,
    "character" TEXT NOT NULL,
    "strokeCount" INTEGER,
    "radical" TEXT,
    "jlpt" INTEGER,
    "grade" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_kanji" (
    "wordId" INTEGER NOT NULL,
    "kanjiId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "word_kanji_pkey" PRIMARY KEY ("wordId","position")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_words" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammars" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "jlpt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grammars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_examples" (
    "id" SERIAL NOT NULL,
    "grammarId" INTEGER NOT NULL,
    "japanese" TEXT NOT NULL,
    "reading" TEXT,
    "english" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "grammar_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_passages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jlpt" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_questions" (
    "id" SERIAL NOT NULL,
    "passageId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "reading_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcard_decks" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" SERIAL NOT NULL,
    "deckId" INTEGER NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "words_jlpt_idx" ON "words"("jlpt");

-- CreateIndex
CREATE INDEX "words_text_idx" ON "words"("text");

-- CreateIndex
CREATE INDEX "readings_wordId_idx" ON "readings"("wordId");

-- CreateIndex
CREATE INDEX "readings_kana_idx" ON "readings"("kana");

-- CreateIndex
CREATE UNIQUE INDEX "readings_wordId_kana_key" ON "readings"("wordId", "kana");

-- CreateIndex
CREATE INDEX "senses_wordId_idx" ON "senses"("wordId");

-- CreateIndex
CREATE INDEX "glosses_senseId_idx" ON "glosses"("senseId");

-- CreateIndex
CREATE INDEX "glosses_lang_idx" ON "glosses"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "kanji_character_key" ON "kanji"("character");

-- CreateIndex
CREATE INDEX "kanji_jlpt_idx" ON "kanji"("jlpt");

-- CreateIndex
CREATE INDEX "word_kanji_kanjiId_idx" ON "word_kanji"("kanjiId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "favorite_words_userId_idx" ON "favorite_words"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_words_userId_wordId_key" ON "favorite_words"("userId", "wordId");

-- CreateIndex
CREATE INDEX "grammars_jlpt_idx" ON "grammars"("jlpt");

-- CreateIndex
CREATE INDEX "grammar_examples_grammarId_idx" ON "grammar_examples"("grammarId");

-- CreateIndex
CREATE INDEX "reading_passages_jlpt_idx" ON "reading_passages"("jlpt");

-- CreateIndex
CREATE INDEX "reading_questions_passageId_idx" ON "reading_questions"("passageId");

-- CreateIndex
CREATE INDEX "flashcard_decks_userId_idx" ON "flashcard_decks"("userId");

-- CreateIndex
CREATE INDEX "flashcards_deckId_idx" ON "flashcards"("deckId");

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senses" ADD CONSTRAINT "senses_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glosses" ADD CONSTRAINT "glosses_senseId_fkey" FOREIGN KEY ("senseId") REFERENCES "senses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_kanji" ADD CONSTRAINT "word_kanji_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_kanji" ADD CONSTRAINT "word_kanji_kanjiId_fkey" FOREIGN KEY ("kanjiId") REFERENCES "kanji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_words" ADD CONSTRAINT "favorite_words_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_words" ADD CONSTRAINT "favorite_words_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grammar_examples" ADD CONSTRAINT "grammar_examples_grammarId_fkey" FOREIGN KEY ("grammarId") REFERENCES "grammars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_questions" ADD CONSTRAINT "reading_questions_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "reading_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
