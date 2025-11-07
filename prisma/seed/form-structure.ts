import { PrismaClient, Prisma } from '@prisma/client';
import { completeFormStructure } from './complete-questions';
import { FormTemplateSeed } from './types';
import { getPrismaClient } from './prisma-factory';

const formStructureData: FormTemplateSeed = completeFormStructure;
const QUESTION_DICTIONARY_MAP: Record<string, string> = {
  'F0.1': 'tech.techId',
  'F0.2': 'tech.technologyName',
  'F0.3': 'tech.reviewerName',
  'F0.5': 'tech.inventorName',
  'F0.7': 'tech.domainAssetClass',
  'F1.1.a': 'triage.technologyOverview',
  'F2.1.a': 'triage.missionAlignmentText',
  'F2.1.score': 'triage.missionAlignmentScore',
  'F2.2.a': 'triage.unmetNeedText',
  'F2.2.score': 'triage.unmetNeedScore',
  'F3.1.a': 'triage.stateOfArtText',
  'F3.2.score': 'triage.stateOfArtScore',
  'F4.1.a': 'triage.marketOverview',
  'F6.2': 'triage.recommendation',
  'F6.3': 'triage.recommendationNotes',
};

export async function seedFormStructure(injectedPrisma?: PrismaClient) {
  const prisma = getPrismaClient(injectedPrisma);

  // Deactivate existing active templates so the newly seeded one becomes canonical
  await prisma.formTemplate.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create the form template
  const template = await prisma.formTemplate.create({
    data: {
      name: formStructureData.name,
      version: formStructureData.version,
      description: formStructureData.description,
      isActive: formStructureData.isActive,
    },
  });

  console.log(`✅ Created form template: ${template.name} (${template.id})`);

  // Create sections and questions
  for (const sectionData of formStructureData.sections) {
    const section = await prisma.formSection.create({
      data: {
        templateId: template.id,
        code: sectionData.code,
        title: sectionData.title,
        description: sectionData.description,
        order: sectionData.order,
        isRequired: sectionData.isRequired,
      },
    });

    console.log(`  ✅ Created section: ${section.code} - ${section.title}`);

    // Create questions for this section
    for (const questionData of sectionData.questions) {
      const dictionaryKey = questionData.dictionaryKey ?? QUESTION_DICTIONARY_MAP[questionData.fieldCode];

      const question = await prisma.formQuestion.create({
        data: {
          sectionId: section.id,
          fieldCode: questionData.fieldCode,
          label: questionData.label,
          type: questionData.type,
          helpText: questionData.helpText ?? null,
          placeholder: questionData.placeholder ?? null,
          validation: toJsonValue(questionData.validation),
          conditional: toJsonValue(questionData.conditional),
          repeatableConfig: toJsonValue(questionData.repeatableConfig),
          order: questionData.order,
          isRequired: questionData.isRequired,
          dictionaryKey: dictionaryKey ?? null,
        },
      });

      console.log(`    ✅ Created question: ${question.fieldCode} - ${question.label}`);

      // Create options if they exist
      if (questionData.options) {
        for (const optionData of questionData.options) {
          await prisma.questionOption.create({
            data: {
              questionId: question.id,
              value: optionData.value,
              label: optionData.label,
              order: optionData.order,
            },
          });
        }
        console.log(`      ✅ Created ${questionData.options.length} options`);
      }

      // Create scoring config if it exists
      if (questionData.scoringConfig) {
        await prisma.scoringConfig.create({
          data: {
            questionId: question.id,
            minScore: questionData.scoringConfig.minScore,
            maxScore: questionData.scoringConfig.maxScore,
            weight: questionData.scoringConfig.weight,
            criteria: toJsonValue(questionData.scoringConfig.criteria) ?? Prisma.JsonNull,
          },
        });
        console.log(`      ✅ Created scoring config`);
      }
    }
  }

  console.log(`🎉 Successfully seeded form structure with ${formStructureData.sections.length} sections`);
  return template;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.JsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}
