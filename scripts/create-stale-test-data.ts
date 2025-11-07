import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_TECH_ID = process.env.TEST_TECH_ID ?? 'TEST-STALE-001';
const TECHNOLOGY_NAME = 'Stale Answer Test Technology';

async function ensureRevisionMismatch() {
  const technologyOverview = await prisma.questionDictionary.findUnique({
    where: { key: 'triage.technologyOverview' },
    include: {
      revisions: {
        orderBy: { versionNumber: 'asc' },
      },
    },
  });

  if (!technologyOverview) {
    throw new Error('Dictionary entry triage.technologyOverview not found');
  }

  const currentRevisionId = technologyOverview.currentRevisionId;
  const staleRevision = technologyOverview.revisions.find((revision) => revision.id !== currentRevisionId);

  if (!currentRevisionId || !staleRevision) {
    throw new Error(
      'Need at least two revisions for triage.technologyOverview to demonstrate stale detection. Run the migration/backfill first.'
    );
  }

  const missionAlignment = await prisma.questionDictionary.findUnique({
    where: { key: 'triage.missionAlignmentText' },
  });

  if (!missionAlignment?.currentRevisionId) {
    throw new Error('Dictionary entry triage.missionAlignmentText missing current revision id');
  }

  return {
    dictionaryId: technologyOverview.id,
    currentRevisionId,
    staleRevisionId: staleRevision.id,
    missionRevisionId: missionAlignment.currentRevisionId,
  };
}

async function ensureTechnology() {
  const baseData = {
    technologyName: TECHNOLOGY_NAME,
    shortDescription: 'Test technology to demonstrate stale answer detection',
    inventorName: 'Dr. Test Inventor',
    inventorTitle: 'Senior Researcher',
    inventorDept: 'Test Department',
    reviewerName: 'Dr. Test Reviewer',
    domainAssetClass: 'medical_device',
    currentStage: 'TRIAGE' as const,
    status: 'ACTIVE' as const,
  };

  const technology = await prisma.technology.upsert({
    where: { techId: TEST_TECH_ID },
    update: {
      ...baseData,
      lastModifiedBy: 'stale-test-script',
      lastModifiedAt: new Date(),
    },
    create: {
      techId: TEST_TECH_ID,
      ...baseData,
      lastModifiedBy: 'stale-test-script',
      lastModifiedAt: new Date(),
    },
  });

  return technology;
}

async function ensureTriageStage(technologyId: string, staleRevisionId: string, missionRevisionId: string) {
  const triageStage = await prisma.triageStage.upsert({
    where: { technologyId },
    update: {
      technologyOverview: 'Structured column answer that should still surface stale metadata',
      missionAlignmentText: 'Mission alignment stays fresh',
      missionAlignmentScore: 2,
      unmetNeedText: 'Test unmet need',
      unmetNeedScore: 2,
      stateOfArtText: 'Test state of art',
      stateOfArtScore: 1,
      marketOverview: 'Test market overview',
      marketScore: 2,
      impactScore: 2,
      valueScore: 1.5,
      recommendation: 'PROCEED',
      extendedData: {
        'triage.technologyOverview': {
          value: 'Extended data answer saved under an older revision id',
          questionRevisionId: staleRevisionId,
          answeredAt: '2025-10-15T10:30:00.000Z',
          source: 'triageStage',
        },
        'triage.missionAlignmentText': {
          value: 'Mission alignment answer that matches the current revision',
          questionRevisionId: missionRevisionId,
          answeredAt: '2025-10-30T14:00:00.000Z',
          source: 'triageStage',
        },
      },
    },
    create: {
      technology: {
        connect: { id: technologyId },
      },
      technologyOverview: 'Structured column answer that should still surface stale metadata',
      missionAlignmentText: 'Mission alignment stays fresh',
      missionAlignmentScore: 2,
      unmetNeedText: 'Test unmet need',
      unmetNeedScore: 2,
      stateOfArtText: 'Test state of art',
      stateOfArtScore: 1,
      marketOverview: 'Test market overview',
      marketScore: 2,
      impactScore: 2,
      valueScore: 1.5,
      recommendation: 'PROCEED',
      extendedData: {
        'triage.technologyOverview': {
          value: 'Extended data answer saved under an older revision id',
          questionRevisionId: staleRevisionId,
          answeredAt: '2025-10-15T10:30:00.000Z',
          source: 'triageStage',
        },
        'triage.missionAlignmentText': {
          value: 'Mission alignment answer that matches the current revision',
          questionRevisionId: missionRevisionId,
          answeredAt: '2025-10-30T14:00:00.000Z',
          source: 'triageStage',
        },
      },
    },
  });

  return triageStage;
}

async function main() {
  console.log('🚧 Preparing reproducible stale-answer test data\n');

  const { staleRevisionId, currentRevisionId, missionRevisionId } = await ensureRevisionMismatch();
  console.log('• Revision ids resolved:', {
    technologyOverviewCurrent: currentRevisionId,
    technologyOverviewStale: staleRevisionId,
    missionAlignmentCurrent: missionRevisionId,
  });

  const technology = await ensureTechnology();
  console.log('• Technology ready:', technology.techId);

  const triageStage = await ensureTriageStage(technology.id, staleRevisionId, missionRevisionId);
  console.log('• Triage stage updated:', triageStage.id);

  console.log('\n✅ Scenario ready');
  console.log(`   Tech ID: ${TEST_TECH_ID}`);
  console.log('   Run: npx dotenv -e .env.prisma-dev -- tsx scripts/test-answer-metadata.ts');
  console.log('   Expect: F1.1.a shows status=STALE even though the structured column carries a value.\n');
}

main()
  .catch((error) => {
    console.error('Error preparing stale test data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
