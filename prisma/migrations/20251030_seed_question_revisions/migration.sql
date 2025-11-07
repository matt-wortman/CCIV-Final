-- Seed initial question revisions from existing dictionary entries
INSERT INTO "question_revisions" (
    "id",
    "dictionaryId",
    "questionKey",
    "versionNumber",
    "label",
    "helpText",
    "options",
    "validation",
    "createdAt",
    "createdBy",
    "changeReason",
    "significantChange"
)
SELECT
    substr(md5(random()::text || clock_timestamp()::text), 1, 24) AS "id",
    q."id",
    q."key",
    1 AS "versionNumber",
    q."label",
    q."helpText",
    q."options",
    q."validation",
    NOW() AS "createdAt",
    'system-migration' AS "createdBy",
    'Initial backfill from dictionary' AS "changeReason",
    FALSE AS "significantChange"
FROM "question_dictionary" q
ON CONFLICT ("questionKey", "versionNumber") DO NOTHING;

-- Attach the newly created revision to the dictionary as the current version
WITH latest AS (
    SELECT q."id" AS dictionary_id, qr."id" AS revision_id, qr."versionNumber" AS version_number
    FROM "question_dictionary" q
    JOIN "question_revisions" qr ON qr."dictionaryId" = q."id"
    WHERE qr."versionNumber" = 1
)
UPDATE "question_dictionary" q
SET "currentRevisionId" = latest.revision_id,
    "currentVersion" = latest.version_number
FROM latest
WHERE latest.dictionary_id = q."id";
