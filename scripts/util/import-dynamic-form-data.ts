/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

type BackupData = {
  generatedAt: string;
  templates: Array<Record<string, unknown>>;
  submissions: Array<Record<string, unknown>>;
  questionDictionary: Array<Record<string, unknown>>;
  technologies: Array<Record<string, unknown>>;
  stageHistory: Array<Record<string, unknown>>;
  auditLog: Array<Record<string, unknown>>;
};

async function loadBackup(filePath: string): Promise<BackupData> {
  const json = await readFile(filePath, 'utf-8');
  const data = JSON.parse(json) as BackupData;
  return data;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

function parseDate(value: unknown): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function assignOptionalDate<T extends Record<string, unknown>>(target: T, key: keyof T, value: unknown) {
  const parsed = parseDate(value);
  if (parsed) {
    (target as Record<string, unknown>)[key as string] = parsed;
  }
}

async function main() {
  const backupPath = process.argv[2];

  if (!backupPath) {
    console.error('Usage: npx tsx scripts/util/import-dynamic-form-data.ts <backup.json>');
    process.exit(1);
  }

  const allowImport = process.env.IMPORT_ALLOW_PURGE === 'true';
  if (!allowImport) {
    console.error(
      '❌ Refusing to import: set IMPORT_ALLOW_PURGE=true to confirm you understand this script will wipe and repopulate dynamic-form tables.'
    );
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(backupPath)
    ? backupPath
    : path.join(process.cwd(), backupPath);

  console.info(`📥 Loading backup from ${resolvedPath}`);
  const backup = await loadBackup(resolvedPath);

  console.info('🧮 Backup metadata:');
  console.info(`   Generated at: ${backup.generatedAt}`);
  console.info(`   Templates: ${backup.templates.length}`);
  console.info(`   Submissions: ${backup.submissions.length}`);
  console.info(`   Question dictionary entries: ${backup.questionDictionary.length}`);
  console.info(`   Technologies: ${backup.technologies.length}`);
  console.info(`   Stage history rows: ${backup.stageHistory.length}`);
  console.info(`   Audit log rows: ${backup.auditLog.length}`);

  await prisma.$transaction(async (tx) => {
    console.info('🧹 Clearing dynamic-form tables...');

    await tx.technologyAuditLog.deleteMany();
    await tx.stageHistory.deleteMany();
    await tx.repeatableGroupResponse.deleteMany();
    await tx.questionResponse.deleteMany();
    await tx.calculatedScore.deleteMany();
    await tx.formSubmission.deleteMany();
    await tx.questionOption.deleteMany();
    await tx.scoringConfig.deleteMany();
    await tx.formQuestion.deleteMany();
    await tx.formSection.deleteMany();
    await tx.formTemplate.deleteMany();
    await tx.questionDictionary.deleteMany();
    await tx.triageStage.deleteMany();
    await tx.viabilityStage.deleteMany();
    await tx.technology.deleteMany();

    console.info('📚 Restoring question dictionary...');
    if (backup.questionDictionary.length > 0) {
      await tx.questionDictionary.createMany({
        data: backup.questionDictionary.map((entry: any) => {
          const record: any = {
            id: entry.id,
            version: entry.version,
            key: entry.key,
            label: entry.label,
            helpText: entry.helpText ?? null,
            options: entry.options ?? Prisma.JsonNull,
            validation: entry.validation ?? Prisma.JsonNull,
            bindingPath: entry.bindingPath,
            dataSource: entry.dataSource,
          };
          assignOptionalDate(record, 'createdAt', entry.createdAt);
          assignOptionalDate(record, 'updatedAt', entry.updatedAt);
          return record;
        }),
        skipDuplicates: true,
      });
    }

    console.info('🧩 Restoring templates, sections, questions...');
    for (const template of backup.templates as any[]) {
      await tx.formTemplate.create({
        data: {
          id: template.id,
          name: template.name,
          version: template.version,
          description: template.description,
          isActive: template.isActive,
          ...(parseDate(template.createdAt) ? { createdAt: parseDate(template.createdAt) } : {}),
          ...(parseDate(template.updatedAt) ? { updatedAt: parseDate(template.updatedAt) } : {}),
          sections: {
            create: (template.sections ?? []).map((section: any) => ({
              id: section.id,
              code: section.code,
              title: section.title,
              description: section.description,
              order: section.order,
              isRequired: section.isRequired,
              ...(parseDate(section.createdAt) ? { createdAt: parseDate(section.createdAt) } : {}),
              ...(parseDate(section.updatedAt) ? { updatedAt: parseDate(section.updatedAt) } : {}),
              questions: {
                create: (section.questions ?? []).map((question: any) => ({
                  id: question.id,
                  fieldCode: question.fieldCode,
                  label: question.label,
                  type: question.type,
                  helpText: question.helpText,
                  placeholder: question.placeholder,
                  validation: question.validation ?? Prisma.JsonNull,
                  conditional: question.conditional ?? Prisma.JsonNull,
                  repeatableConfig: question.repeatableConfig ?? Prisma.JsonNull,
                  order: question.order,
                  isRequired: question.isRequired,
                  dictionaryKey: question.dictionaryKey ?? null,
                  ...(parseDate(question.createdAt) ? { createdAt: parseDate(question.createdAt) } : {}),
                  ...(parseDate(question.updatedAt) ? { updatedAt: parseDate(question.updatedAt) } : {}),
                  options: {
                    create: (question.options ?? []).map((option: any) => ({
                      id: option.id,
                      value: option.value,
                      label: option.label,
                      order: option.order,
                      ...(parseDate(option.createdAt) ? { createdAt: parseDate(option.createdAt) } : {}),
                      ...(parseDate(option.updatedAt) ? { updatedAt: parseDate(option.updatedAt) } : {}),
                    })),
                  },
                  scoringConfig: question.scoringConfig
                    ? {
                        create: {
                          id: question.scoringConfig.id,
                          minScore: question.scoringConfig.minScore,
                          maxScore: question.scoringConfig.maxScore,
                          weight: question.scoringConfig.weight,
                          criteria: question.scoringConfig.criteria ?? Prisma.JsonNull,
                          ...(parseDate(question.scoringConfig.createdAt)
                            ? { createdAt: parseDate(question.scoringConfig.createdAt) }
                            : {}),
                          ...(parseDate(question.scoringConfig.updatedAt)
                            ? { updatedAt: parseDate(question.scoringConfig.updatedAt) }
                            : {}),
                        },
                      }
                    : undefined,
                })),
              },
            })),
          },
        },
      });
    }

    console.info('🧾 Restoring technologies and supplements...');
    for (const tech of backup.technologies as any[]) {
      await tx.technology.create({
        data: {
          id: tech.id,
          techId: tech.techId,
          technologyName: tech.technologyName,
          shortDescription: tech.shortDescription,
          inventorName: tech.inventorName,
          inventorTitle: tech.inventorTitle,
          inventorDept: tech.inventorDept,
          reviewerName: tech.reviewerName,
          domainAssetClass: tech.domainAssetClass,
          currentStage: tech.currentStage,
          status: tech.status,
          lastStageTouched: tech.lastStageTouched,
          lastModifiedBy: tech.lastModifiedBy,
          lastModifiedAt: parseDate(tech.lastModifiedAt) ?? null,
          rowVersion: tech.rowVersion ?? 1,
          ...(parseDate(tech.createdAt) ? { createdAt: parseDate(tech.createdAt) } : {}),
          ...(parseDate(tech.updatedAt) ? { updatedAt: parseDate(tech.updatedAt) } : {}),
          triageStage: tech.triageStage
            ? {
                create: {
                  id: tech.triageStage.id,
                  technologyOverview: tech.triageStage.technologyOverview,
                  missionAlignmentText: tech.triageStage.missionAlignmentText,
                  missionAlignmentScore: tech.triageStage.missionAlignmentScore,
                  unmetNeedText: tech.triageStage.unmetNeedText ?? '',
                  unmetNeedScore: tech.triageStage.unmetNeedScore ?? 0,
                  stateOfArtText: tech.triageStage.stateOfArtText ?? '',
                  stateOfArtScore: tech.triageStage.stateOfArtScore ?? 0,
                  marketOverview: tech.triageStage.marketOverview ?? '',
                  marketScore: tech.triageStage.marketScore ?? 0,
                  impactScore: tech.triageStage.impactScore ?? 0,
                  valueScore: tech.triageStage.valueScore ?? 0,
                  recommendation: tech.triageStage.recommendation ?? '',
                  recommendationNotes: tech.triageStage.recommendationNotes ?? null,
                  rowVersion: tech.triageStage.rowVersion ?? 1,
                  ...(parseDate(tech.triageStage.createdAt)
                    ? { createdAt: parseDate(tech.triageStage.createdAt) }
                    : {}),
                  ...(parseDate(tech.triageStage.updatedAt)
                    ? { updatedAt: parseDate(tech.triageStage.updatedAt) }
                    : {}),
                },
              }
            : undefined,
          viabilityStage: tech.viabilityStage
            ? {
                create: {
                  id: tech.viabilityStage.id,
                  technicalFeasibility: tech.viabilityStage.technicalFeasibility ?? '',
                  regulatoryPathway: tech.viabilityStage.regulatoryPathway ?? '',
                  costAnalysis: tech.viabilityStage.costAnalysis ?? '',
                  timeToMarket: tech.viabilityStage.timeToMarket ?? null,
                  resourceRequirements: tech.viabilityStage.resourceRequirements ?? '',
                  riskAssessment: tech.viabilityStage.riskAssessment ?? '',
                  technicalScore: tech.viabilityStage.technicalScore ?? 0,
                  commercialScore: tech.viabilityStage.commercialScore ?? 0,
                  overallViability: tech.viabilityStage.overallViability ?? '',
                  rowVersion: tech.viabilityStage.rowVersion ?? 1,
                  ...(parseDate(tech.viabilityStage.createdAt)
                    ? { createdAt: parseDate(tech.viabilityStage.createdAt) }
                    : {}),
                  ...(parseDate(tech.viabilityStage.updatedAt)
                    ? { updatedAt: parseDate(tech.viabilityStage.updatedAt) }
                    : {}),
                },
              }
            : undefined,
        },
      });
    }

    console.info('📝 Restoring submissions and responses...');
    for (const submission of backup.submissions as any[]) {
      await tx.formSubmission.create({
        data: {
          id: submission.id,
          templateId: submission.templateId,
          status: submission.status,
          submittedBy: submission.submittedBy,
          submittedAt: parseDate(submission.submittedAt) ?? null,
          ...(parseDate(submission.createdAt) ? { createdAt: parseDate(submission.createdAt) } : {}),
          ...(parseDate(submission.updatedAt) ? { updatedAt: parseDate(submission.updatedAt) } : {}),
          repeatGroups: {
            create: (submission.repeatGroups ?? []).map((group: any) => ({
              id: group.id,
              questionCode: group.questionCode,
              rowIndex: group.rowIndex,
              data: toJsonValue(group.data),
            })),
          },
          responses: {
            create: (submission.responses ?? []).map((response: any) => ({
              id: response.id,
              questionCode: response.questionCode,
              value: toJsonValue(response.value),
            })),
          },
          scores: {
            create: (submission.scores ?? []).map((score: any) => ({
              id: score.id,
              scoreType: score.scoreType,
              value: score.value,
            })),
          },
        },
      });
    }

    console.info('📘 Restoring stage history...');
    if (backup.stageHistory.length > 0) {
      await tx.stageHistory.createMany({
        data: backup.stageHistory.map((entry: any) => ({
          id: entry.id,
          technologyId: entry.technologyId,
          stage: entry.stage,
          changeType: entry.changeType,
          snapshot: toJsonValue(entry.snapshot),
          changedBy: entry.changedBy,
          changedAt: parseDate(entry.changedAt) ?? new Date(),
        })),
        skipDuplicates: true,
      });
    }

    console.info('🗒️ Restoring audit log...');
    if (backup.auditLog.length > 0) {
      await tx.technologyAuditLog.createMany({
        data: backup.auditLog.map((entry: any) => ({
          id: entry.id,
          technologyId: entry.technologyId,
          fieldPath: entry.fieldPath,
          oldValue: toJsonValue(entry.oldValue),
          newValue: toJsonValue(entry.newValue),
          stage: entry.stage ?? null,
          persona: entry.persona ?? null,
          changedBy: entry.changedBy,
          changedAt: parseDate(entry.changedAt) ?? new Date(),
        })),
        skipDuplicates: true,
      });
    }
  });

  console.info('✅ Import completed successfully.');
}

main()
  .catch((error) => {
    console.error('❌ Import failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
