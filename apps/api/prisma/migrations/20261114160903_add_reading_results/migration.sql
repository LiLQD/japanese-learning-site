-- CreateTable
CREATE TABLE "reading_results" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "passageId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_result_details" (
    "id" SERIAL NOT NULL,
    "resultId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "selectedOption" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "reading_result_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_results_userId_idx" ON "reading_results"("userId");

-- CreateIndex
CREATE INDEX "reading_results_passageId_idx" ON "reading_results"("passageId");

-- CreateIndex
CREATE INDEX "reading_result_details_resultId_idx" ON "reading_result_details"("resultId");

-- CreateIndex
CREATE INDEX "reading_result_details_questionId_idx" ON "reading_result_details"("questionId");

-- AddForeignKey
ALTER TABLE "reading_results" ADD CONSTRAINT "reading_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_results" ADD CONSTRAINT "reading_results_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "reading_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_result_details" ADD CONSTRAINT "reading_result_details_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "reading_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_result_details" ADD CONSTRAINT "reading_result_details_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "reading_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
