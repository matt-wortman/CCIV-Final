-- AlterTable
ALTER TABLE "public"."form_questions" ADD COLUMN "dictionaryKey" TEXT;

-- CreateIndex
CREATE INDEX "form_questions_dictionaryKey_idx" ON "public"."form_questions"("dictionaryKey");

-- AddForeignKey
ALTER TABLE "public"."form_questions"
  ADD CONSTRAINT "form_questions_dictionaryKey_fkey"
  FOREIGN KEY ("dictionaryKey") REFERENCES "public"."question_dictionary"("key")
  ON DELETE SET NULL ON UPDATE CASCADE;
