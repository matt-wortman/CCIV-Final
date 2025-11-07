import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Question Dictionary Entries ===');
  const dictionaries = await prisma.questionDictionary.findMany({
    select: {
      id: true,
      key: true,
      label: true,
      bindingPath: true,
      currentRevisionId: true,
      currentVersion: true,
    },
    take: 5,
  });

  console.table(dictionaries);

  console.log('\n=== Question Revisions ===');
  const revisions = await prisma.questionRevision.findMany({
    select: {
      id: true,
      questionKey: true,
      versionNumber: true,
      label: true,
      createdAt: true,
    },
    take: 5,
  });

  console.table(revisions);

  await prisma.$disconnect();
}

main().catch(console.error);
