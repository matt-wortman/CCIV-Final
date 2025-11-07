-- CreateTable
CREATE TABLE "public"."triage_forms" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewer" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,
    "inventorsTitle" TEXT NOT NULL,
    "domainAssetClass" TEXT NOT NULL,
    "technologyOverview" TEXT NOT NULL,
    "missionAlignmentText" TEXT NOT NULL,
    "missionAlignmentScore" INTEGER NOT NULL DEFAULT 0,
    "unmetNeedText" TEXT NOT NULL,
    "unmetNeedScore" INTEGER NOT NULL DEFAULT 0,
    "stateOfArtText" TEXT NOT NULL,
    "stateOfArtScore" INTEGER NOT NULL DEFAULT 0,
    "marketOverview" TEXT NOT NULL,
    "marketScore" INTEGER NOT NULL DEFAULT 0,
    "digitalQuestion1" BOOLEAN NOT NULL DEFAULT false,
    "digitalQuestion2" BOOLEAN NOT NULL DEFAULT false,
    "digitalQuestion3" BOOLEAN NOT NULL DEFAULT false,
    "digitalQuestion4" BOOLEAN NOT NULL DEFAULT false,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valueScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendation" TEXT NOT NULL DEFAULT '',
    "recommendationText" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "triage_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competitors" (
    "id" TEXT NOT NULL,
    "triageFormId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "productRevenue" TEXT,
    "pointOfContact" TEXT,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subject_matter_experts" (
    "id" TEXT NOT NULL,
    "triageFormId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "organization" TEXT,
    "contactInfo" TEXT,
    "expertise" TEXT,
    "recommendation" TEXT,

    CONSTRAINT "subject_matter_experts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."competitors" ADD CONSTRAINT "competitors_triageFormId_fkey" FOREIGN KEY ("triageFormId") REFERENCES "public"."triage_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subject_matter_experts" ADD CONSTRAINT "subject_matter_experts_triageFormId_fkey" FOREIGN KEY ("triageFormId") REFERENCES "public"."triage_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
