import path from "node:path";
import { loadEnvConfig } from "@next/env";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

/**
 * Valid binding targets, generated manually for now.
 * TODO: replace with generated file derived from Prisma schema.
 */
const bindingRegistry = new Set<string>([
  "technology.techId",
  "technology.technologyName",
  "technology.shortDescription",
  "technology.inventorName",
  "technology.inventorTitle",
  "technology.inventorDept",
  "technology.reviewerName",
  "technology.domainAssetClass",
  "triageStage.technologyOverview",
  "triageStage.missionAlignmentText",
  "triageStage.missionAlignmentScore",
  "triageStage.unmetNeedText",
  "triageStage.unmetNeedScore",
  "triageStage.stateOfArtText",
  "triageStage.stateOfArtScore",
  "triageStage.marketOverview",
  "triageStage.marketScore",
  "triageStage.impactScore",
  "triageStage.valueScore",
  "triageStage.recommendation",
  "triageStage.recommendationNotes",
  "viabilityStage.technicalFeasibility",
  "viabilityStage.regulatoryPathway",
  "viabilityStage.costAnalysis",
  "viabilityStage.timeToMarket",
  "viabilityStage.resourceRequirements",
  "viabilityStage.riskAssessment",
  "viabilityStage.technicalScore",
  "viabilityStage.commercialScore",
  "viabilityStage.overallViability",
]);

const catalogEntrySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  bindingPath: z.string().min(1),
  dataSource: z.enum(["TECHNOLOGY", "STAGE_SUPPLEMENT", "CALCULATED"]),
});

async function main() {
  const projectDir = path.join(__dirname, "..", "..");
  loadEnvConfig(projectDir);

  const currentDbUrl = process.env.DATABASE_URL;
  if (!currentDbUrl || currentDbUrl.includes("localhost:5432")) {
    const envPath = path.join(projectDir, ".env.prisma-dev");
    const result = dotenv.config({ path: envPath, override: true });
    if (result.error) {
      console.warn("Failed to load .env.prisma-dev:", result.error.message);
    } else {
      console.info(`Loaded .env.prisma-dev for DATABASE_URL (${process.env.DATABASE_URL})`);
    }
  }

  const prisma = new PrismaClient();
  try {
    const entries = await prisma.questionDictionary.findMany();

    const errors: string[] = [];
    for (const entry of entries) {
      const parsed = catalogEntrySchema.safeParse(entry);
      if (!parsed.success) {
        errors.push(`Validation error for key '${entry.key}': ${parsed.error.message}`);
        continue;
      }

      if (!bindingRegistry.has(entry.bindingPath)) {
        errors.push(`Unknown bindingPath '${entry.bindingPath}' for key '${entry.key}'`);
      }
    }

    if (errors.length > 0) {
      console.error(`\nFound ${errors.length} catalog binding issues:`);
      for (const message of errors) {
        console.error(`  - ${message}`);
      }
      process.exitCode = 1;
    } else {
      console.log(`All ${entries.length} catalog entries look good!`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to validate catalog", error);
  process.exitCode = 1;
});
