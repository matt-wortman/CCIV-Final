-- Add revision pointer to single-value responses
ALTER TABLE "question_responses"
    ADD COLUMN "questionRevisionId" TEXT;

CREATE INDEX "question_responses_questionRevisionId_idx"
    ON "question_responses" ("questionRevisionId");

ALTER TABLE "question_responses"
    ADD CONSTRAINT "question_responses_questionRevisionId_fkey"
        FOREIGN KEY ("questionRevisionId") REFERENCES "question_revisions" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- Add revision pointer to repeatable group rows
ALTER TABLE "repeatable_group_responses"
    ADD COLUMN "questionRevisionId" TEXT;

CREATE INDEX "repeatable_group_responses_questionRevisionId_idx"
    ON "repeatable_group_responses" ("questionRevisionId");

ALTER TABLE "repeatable_group_responses"
    ADD CONSTRAINT "repeatable_group_responses_questionRevisionId_fkey"
        FOREIGN KEY ("questionRevisionId") REFERENCES "question_revisions" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
