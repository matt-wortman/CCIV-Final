import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIELD_TO_DICTIONARY: Record<string, string> = {
  "F0.1": "tech.techId",
  "F0.2": "tech.technologyName",
  "F0.3": "tech.reviewerName",
  "F0.5": "tech.inventorName",
  "F0.7": "tech.domainAssetClass",
  "F1.1.a": "triage.technologyOverview",
  "F2.1.a": "triage.missionAlignmentText",
  "F2.1.score": "triage.missionAlignmentScore",
  "F2.2.a": "triage.unmetNeedText",
  "F2.2.score": "triage.unmetNeedScore",
  "F3.1.a": "triage.stateOfArtText",
  "F3.2.score": "triage.stateOfArtScore",
  "F4.1.a": "triage.marketOverview",
  "F6.2": "triage.recommendation",
  "F6.3": "triage.recommendationNotes",
};

async function main() {
  const dictionaryEntries = await prisma.questionDictionary.findMany({
    select: { key: true },
  });
  const dictionaryKeys = new Set(dictionaryEntries.map((entry) => entry.key));

  const template = await prisma.formTemplate.findFirst({
    where: { isActive: true },
    include: {
      sections: {
        include: { questions: true },
      },
    },
  });

  if (!template) {
    console.warn("No active template found; nothing to update.");
    return;
  }

  const updates = [] as Array<ReturnType<typeof prisma.formQuestion.update>>;

  for (const section of template.sections) {
    for (const question of section.questions) {
      const mappedKey = FIELD_TO_DICTIONARY[question.fieldCode];
      if (!mappedKey) continue;

      if (!dictionaryKeys.has(mappedKey)) {
        console.warn(
          `Dictionary key '${mappedKey}' missing for field ${question.fieldCode}; skipping.`
        );
        continue;
      }

      if (question.dictionaryKey === mappedKey) {
        continue;
      }

      updates.push(
        prisma.formQuestion.update({
          where: { id: question.id },
          data: { dictionaryKey: mappedKey },
        })
      );
    }
  }

  if (updates.length === 0) {
    console.log("All questions already have correct dictionary keys.");
    return;
  }

  await prisma.$transaction(updates);
  console.log(`Updated ${updates.length} questions with dictionary bindings.`);
}

main()
  .catch((error) => {
    console.error("Failed to attach dictionary keys", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
