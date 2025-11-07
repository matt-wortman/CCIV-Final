-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'INTEGER', 'SINGLE_SELECT', 'MULTI_SELECT', 'CHECKBOX_GROUP', 'DATE', 'REPEATABLE_GROUP', 'SCORING_0_3');

-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."form_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_sections" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_questions" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "fieldCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "public"."FieldType" NOT NULL,
    "helpText" TEXT,
    "placeholder" TEXT,
    "validation" JSONB,
    "conditional" JSONB,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "form_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scoring_configs" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 3,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "criteria" JSONB NOT NULL,

    CONSTRAINT "scoring_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_submissions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_responses" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."repeatable_group_responses" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "repeatable_group_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calculated_scores" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "scoreType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculated_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scoring_configs_questionId_key" ON "public"."scoring_configs"("questionId");

-- AddForeignKey
ALTER TABLE "public"."form_sections" ADD CONSTRAINT "form_sections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_questions" ADD CONSTRAINT "form_questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."form_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."form_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scoring_configs" ADD CONSTRAINT "scoring_configs_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."form_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_submissions" ADD CONSTRAINT "form_submissions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."question_responses" ADD CONSTRAINT "question_responses_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repeatable_group_responses" ADD CONSTRAINT "repeatable_group_responses_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calculated_scores" ADD CONSTRAINT "calculated_scores_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
