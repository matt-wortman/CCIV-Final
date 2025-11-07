import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

function isMissingColumnError(error: unknown, column: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string; meta?: Record<string, unknown> }).code === 'P2022' &&
    (error as { meta?: Record<string, unknown> }).meta?.column === column
  );
}

async function loadFormTemplates() {
  try {
    return await prisma.formTemplate.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: { orderBy: { order: 'asc' } },
                scoringConfig: true,
                dictionary: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isMissingColumnError(error, 'form_questions.dictionaryKey')) {
      console.warn(
        '⚠️  Current database schema lacks form_questions.dictionaryKey; exporting without dictionary relations.'
      );
      return prisma.formTemplate.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          sections: {
            orderBy: { order: 'asc' },
            include: {
              questions: {
                orderBy: { order: 'asc' },
                include: {
                  options: { orderBy: { order: 'asc' } },
                  scoringConfig: true,
                },
              },
            },
          },
        },
      });
    }
    throw error;
  }
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupPath = path.join(backupDir, `dynamic-form-backup-${timestamp}.json`);

  console.info('🔄 Fetching current dynamic-form data...');

  const [
    templates,
    submissions,
    questionDictionary,
    technologies,
    stageHistory,
    auditLog,
  ] = await Promise.all([
    loadFormTemplates(),
    prisma.formSubmission.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        responses: true,
        repeatGroups: true,
        scores: true,
        template: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
      },
    }),
    prisma.questionDictionary.findMany({
      orderBy: { key: 'asc' },
    }),
    prisma.technology.findMany({
      orderBy: { techId: 'asc' },
      include: {
        triageStage: true,
        viabilityStage: true,
        attachments: true,
        auditLog: true,
      },
    }),
    prisma.stageHistory.findMany({
      orderBy: { changedAt: 'asc' },
    }),
    prisma.technologyAuditLog.findMany({
      orderBy: { changedAt: 'asc' },
    }),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    templates,
    submissions,
    questionDictionary,
    technologies,
    stageHistory,
    auditLog,
  };

  await mkdir(backupDir, { recursive: true });
  await writeFile(backupPath, JSON.stringify(payload, null, 2), 'utf-8');

  console.info(`✅ Backup written to ${backupPath}`);
}

main()
  .catch((error) => {
    console.error('❌ Backup failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
