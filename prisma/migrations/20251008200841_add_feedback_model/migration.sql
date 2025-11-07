-- CreateTable
CREATE TABLE "public"."Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contactInfo" TEXT,
    "userId" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
