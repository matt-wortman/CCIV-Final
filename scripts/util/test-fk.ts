import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`INSERT INTO triage_stages (id, technologyId, technologyOverview, missionAlignmentText, missionAlignmentScore, unmetNeedText, unmetNeedScore, stateOfArtText, stateOfArtScore, marketOverview, marketScore, impactScore, valueScore, recommendation)
    VALUES ('test-fk', 'nonexistent', 't', 't', 0, 't', 0, 't', 0, 't', 0, 0, 0, 't')`;
    console.log('insert succeeded unexpectedly');
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: string }).code
      : undefined;
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('insert failed as expected:', code ?? message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
