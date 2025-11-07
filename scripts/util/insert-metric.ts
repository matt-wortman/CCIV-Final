import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tech = await prisma.technology.findFirst({ select: { id: true } });
  if (!tech) {
    console.error("No technology found to attach metric to");
    process.exit(1);
  }

  const metric = await prisma.calculatedMetric.create({
    data: {
      technologyId: tech.id,
      key: "overallScore",
      expression: "average(triageStage.impactScore, viabilityStage.technicalScore)",
      dependsOn: ["triageStage.impactScore", "viabilityStage.technicalScore"],
    },
    select: {
      id: true,
      status: true,
      calculatedAt: true,
    },
  });

  console.log(JSON.stringify(metric, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
