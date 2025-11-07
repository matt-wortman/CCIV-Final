import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_TECH_ID = process.env.TEST_TECH_ID ?? 'TEST-STALE-001';

type Mode = 'stale' | 'clear';

function resolveMode(): Mode {
  if (process.argv.includes('--clear')) {
    return 'clear';
  }
  if (process.argv.includes('--stale')) {
    return 'stale';
  }
  // Default to stale if nothing is provided to preserve the previous usage pattern.
  return 'stale';
}

async function fetchRevisions(dictionaryKey: string) {
  const dictionary = await prisma.questionDictionary.findUnique({
    where: { key: dictionaryKey },
    include: {
      revisions: {
        orderBy: { versionNumber: 'asc' },
      },
    },
  });

  if (!dictionary) {
    throw new Error(`Dictionary entry ${dictionaryKey} not found`);
  }

  const { currentRevisionId, revisions } = dictionary;
  const staleRevision = revisions.find((revision) => revision.id !== currentRevisionId);

  if (!currentRevisionId) {
    throw new Error(`Dictionary entry ${dictionaryKey} missing current revision id`);
  }

  if (!staleRevision) {
    throw new Error(
      `Dictionary entry ${dictionaryKey} needs at least two revisions to demonstrate stale detection`
    );
  }

  return { currentRevisionId, staleRevisionId: staleRevision.id };
}

async function fetchCurrentRevisionId(dictionaryKey: string) {
  const dictionary = await prisma.questionDictionary.findUnique({
    where: { key: dictionaryKey },
  });

  if (!dictionary?.currentRevisionId) {
    throw new Error(`Dictionary entry ${dictionaryKey} missing current revision id`);
  }

  return dictionary.currentRevisionId;
}

async function updateExtendedData(mode: Mode) {
  const triageStage = await prisma.triageStage.findFirst({
    where: { technology: { techId: TEST_TECH_ID } },
  });

  if (!triageStage) {
    throw new Error(`No triage stage found for technology ${TEST_TECH_ID}`);
  }

  const existingExtended =
    (triageStage.extendedData as Prisma.JsonObject | null) ?? {};
  const extendedData: Record<string, unknown> = { ...existingExtended };

  if (mode === 'clear') {
    delete extendedData['triage.technologyOverview'];
    await prisma.triageStage.update({
      where: { id: triageStage.id },
      data: {
        technologyOverview: 'Structured column with no extendedData metadata',
        extendedData: extendedData as Prisma.InputJsonValue,
      },
    });

    console.log('🧹 Cleared triage.technologyOverview metadata from extendedData.');
    console.log('   Expect answerMetadata status=UNKNOWN (no revision id stored).');
    return;
  }

  const { staleRevisionId } = await fetchRevisions('triage.technologyOverview');
  const missionRevisionId = await fetchCurrentRevisionId('triage.missionAlignmentText');

  extendedData['triage.technologyOverview'] = {
    value: 'Extended data answer saved under an older revision id',
    questionRevisionId: staleRevisionId,
    answeredAt: '2025-10-15T10:30:00.000Z',
    source: 'triageStage',
  };

  extendedData['triage.missionAlignmentText'] = {
    value: 'Mission alignment answer that matches the current revision',
    questionRevisionId: missionRevisionId,
    answeredAt: '2025-10-30T14:00:00.000Z',
    source: 'triageStage',
  };

  await prisma.triageStage.update({
    where: { id: triageStage.id },
    data: {
      technologyOverview: 'Structured column answer that should still surface stale metadata',
      extendedData: extendedData as Prisma.InputJsonValue,
    },
  });

  console.log('✅ Restored stale metadata while keeping structured column populated.');
  console.log('   Expect answerMetadata status=STALE for triage.technologyOverview.');
}

async function main() {
  const mode = resolveMode();
  console.log(`Adjusting stale test data for ${TEST_TECH_ID} (${mode} mode)...\n`);

  await updateExtendedData(mode);

  console.log('\nNext steps:');
  console.log('  npx dotenv -e .env.prisma-dev -- tsx scripts/test-answer-metadata.ts');
  if (mode === 'clear') {
    console.log('  → F1.1.a should report status=UNKNOWN');
  } else {
    console.log('  → F1.1.a should report status=STALE');
  }
}

main()
  .catch((error) => {
    console.error('Error adjusting test data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
