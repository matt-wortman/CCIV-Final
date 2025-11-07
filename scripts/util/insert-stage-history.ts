import { PrismaClient, TechStage } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tech = await prisma.technology.findFirst({ select: { id: true } });
  if (!tech) {
    console.error("No technology found to create stage history for");
    process.exit(1);
  }

  const history = await prisma.stageHistory.create({
    data: {
      technologyId: tech.id,
      stage: TechStage.TRIAGE,
      changeType: "CREATED",
      snapshot: { message: "Initial state" },
      changedBy: "manager@example.com",
    },
    select: { id: true, changedAt: true },
  });

  console.log(JSON.stringify(history, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
