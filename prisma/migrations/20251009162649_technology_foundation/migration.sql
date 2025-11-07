-- CreateEnum
CREATE TYPE "public"."TechStage" AS ENUM ('TRIAGE', 'VIABILITY', 'COMMERCIAL', 'MARKET_READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."TechStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'ABANDONED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."DataSource" AS ENUM ('TECHNOLOGY', 'STAGE_SUPPLEMENT', 'CALCULATED');

-- CreateTable
CREATE TABLE "public"."triage_competitors" (
    "id" TEXT NOT NULL,
    "triageStageId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "product" TEXT,
    "revenue" TEXT,
    "notes" TEXT,

    CONSTRAINT "triage_competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."triage_smes" (
    "id" TEXT NOT NULL,
    "triageStageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "organization" TEXT,
    "contactInfo" TEXT,
    "expertise" TEXT,
    "recommendation" TEXT,

    CONSTRAINT "triage_smes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."technologies" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "techId" TEXT NOT NULL,
    "technologyName" TEXT NOT NULL,
    "shortDescription" TEXT,
    "inventorName" TEXT NOT NULL,
    "inventorTitle" TEXT,
    "inventorDept" TEXT,
    "reviewerName" TEXT NOT NULL,
    "domainAssetClass" TEXT NOT NULL,
    "currentStage" "public"."TechStage" NOT NULL DEFAULT 'TRIAGE',
    "status" "public"."TechStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastStageTouched" "public"."TechStage",
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3),

    CONSTRAINT "technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."triage_stages" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "technologyOverview" TEXT NOT NULL,
    "missionAlignmentText" TEXT NOT NULL,
    "missionAlignmentScore" INTEGER NOT NULL DEFAULT 0,
    "unmetNeedText" TEXT NOT NULL,
    "unmetNeedScore" INTEGER NOT NULL DEFAULT 0,
    "stateOfArtText" TEXT NOT NULL,
    "stateOfArtScore" INTEGER NOT NULL DEFAULT 0,
    "marketOverview" TEXT NOT NULL,
    "marketScore" INTEGER NOT NULL DEFAULT 0,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valueScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendation" TEXT NOT NULL DEFAULT '',
    "recommendationNotes" TEXT,

    CONSTRAINT "triage_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."viability_stages" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowVersion" INTEGER NOT NULL DEFAULT 1,
    "technicalFeasibility" TEXT NOT NULL,
    "regulatoryPathway" TEXT NOT NULL,
    "costAnalysis" TEXT NOT NULL,
    "timeToMarket" INTEGER,
    "resourceRequirements" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "technicalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commercialScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallViability" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "viability_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stage_history" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "stage" "public"."TechStage" NOT NULL,
    "changeType" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."technology_audit_log" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "stage" "public"."TechStage",
    "persona" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technology_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calculated_metrics" (
    "id" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "expression" TEXT NOT NULL,
    "dependsOn" TEXT[],
    "calculatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,

    CONSTRAINT "calculated_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."question_dictionary" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "helpText" TEXT,
    "options" JSONB,
    "validation" JSONB,
    "bindingPath" TEXT NOT NULL,
    "dataSource" "public"."DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."personas" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_personas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "triage_competitors_triageStageId_idx" ON "public"."triage_competitors"("triageStageId");

-- CreateIndex
CREATE INDEX "triage_smes_triageStageId_idx" ON "public"."triage_smes"("triageStageId");

-- CreateIndex
CREATE UNIQUE INDEX "technologies_techId_key" ON "public"."technologies"("techId");

-- CreateIndex
CREATE INDEX "technologies_techId_idx" ON "public"."technologies"("techId");

-- CreateIndex
CREATE INDEX "technologies_currentStage_idx" ON "public"."technologies"("currentStage");

-- CreateIndex
CREATE UNIQUE INDEX "triage_stages_technologyId_key" ON "public"."triage_stages"("technologyId");

-- CreateIndex
CREATE UNIQUE INDEX "viability_stages_technologyId_key" ON "public"."viability_stages"("technologyId");

-- CreateIndex
CREATE INDEX "stage_history_technologyId_stage_idx" ON "public"."stage_history"("technologyId", "stage");

-- CreateIndex
CREATE INDEX "technology_audit_log_technologyId_changedAt_idx" ON "public"."technology_audit_log"("technologyId", "changedAt");

-- CreateIndex
CREATE INDEX "attachments_technologyId_idx" ON "public"."attachments"("technologyId");

-- CreateIndex
CREATE INDEX "calculated_metrics_technology_key_idx" ON "public"."calculated_metrics"("technologyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "question_dictionary_key_key" ON "public"."question_dictionary"("key");

-- CreateIndex
CREATE INDEX "question_dictionary_version_idx" ON "public"."question_dictionary"("version");

-- CreateIndex
CREATE UNIQUE INDEX "personas_code_key" ON "public"."personas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_personas_userId_personaId_key" ON "public"."user_personas"("userId", "personaId");

-- AddForeignKey
ALTER TABLE "public"."triage_competitors" ADD CONSTRAINT "triage_competitors_triageStageId_fkey" FOREIGN KEY ("triageStageId") REFERENCES "public"."triage_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."triage_smes" ADD CONSTRAINT "triage_smes_triageStageId_fkey" FOREIGN KEY ("triageStageId") REFERENCES "public"."triage_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."triage_stages" ADD CONSTRAINT "triage_stages_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."viability_stages" ADD CONSTRAINT "viability_stages_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stage_history" ADD CONSTRAINT "stage_history_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."technology_audit_log" ADD CONSTRAINT "technology_audit_log_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."calculated_metrics" ADD CONSTRAINT "calculated_metrics_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "public"."technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_personas" ADD CONSTRAINT "user_personas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_personas" ADD CONSTRAINT "user_personas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "public"."personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
