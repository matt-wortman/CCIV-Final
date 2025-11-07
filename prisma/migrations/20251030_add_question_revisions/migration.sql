-- Create table for immutable question revisions
CREATE TABLE "question_revisions" (
    "id" TEXT NOT NULL,
    "dictionaryId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "changeReason" TEXT,
    "significantChange" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "question_revisions_pkey" PRIMARY KEY ("id")
);

-- Ensure question key + version is unique and support dictionary lookups
CREATE UNIQUE INDEX "question_revisions_questionKey_versionNumber_key"
    ON "question_revisions"("questionKey", "versionNumber");
CREATE INDEX "question_revisions_dictionaryId_idx"
    ON "question_revisions"("dictionaryId");

-- Add revision tracking columns to the dictionary
ALTER TABLE "question_dictionary"
    ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "currentRevisionId" TEXT;
CREATE UNIQUE INDEX "question_dictionary_currentRevisionId_key"
    ON "question_dictionary"("currentRevisionId");

-- Add extended data JSON storage for flexible answers
ALTER TABLE "triage_stages"
    ADD COLUMN "extendedData" JSONB;
ALTER TABLE "viability_stages"
    ADD COLUMN "extendedData" JSONB;

-- Wire up foreign keys after all objects exist
ALTER TABLE "question_revisions"
    ADD CONSTRAINT "question_revisions_dictionaryId_fkey"
        FOREIGN KEY ("dictionaryId") REFERENCES "question_dictionary"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_dictionary"
    ADD CONSTRAINT "question_dictionary_currentRevisionId_fkey"
        FOREIGN KEY ("currentRevisionId") REFERENCES "question_revisions"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
